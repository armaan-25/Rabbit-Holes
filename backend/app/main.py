import os
import hashlib
import json
import uuid

from dotenv import load_dotenv

load_dotenv()  # pull ANTHROPIC_API_KEY etc. from backend/.env before anything else

from fastapi import FastAPI, Query
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware

from . import store, ai, db
from .auth import CurrentUser, get_current_user
from .rate_limit import check as rate_limit
from .schemas import EventBatch, AskRequest, SynthesizeRequest, ClearRequest, HoleUpdate, BulkHoleAction

app = FastAPI(title="Rabbit Holes API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("WEB_ORIGIN", "http://localhost:3000").split(",") if o.strip()],
    allow_origin_regex=r"chrome-extension://.*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    db.ensure_schema()
    return {"ok": True, "db": db.status()}


@app.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    db.ensure_user(user.id, user.email)
    return {"id": user.id, "email": user.email, "db": db.enabled()}


@app.post("/sessions")
def create_session(user: CurrentUser = Depends(get_current_user)):
    db.ensure_user(user.id, user.email)
    session_id = str(uuid.uuid4())
    db.ensure_session(user.id, session_id)
    return {"session_id": session_id}


@app.post("/events")
def ingest(batch: EventBatch, user: CurrentUser = Depends(get_current_user)):
    """Receive a batch of captured browsing events from the extension."""
    rate_limit("events", user.id)
    db.ensure_user(user.id, user.email)
    total = store.add_events(batch.events, user.id)
    return {"received": len(batch.events), "total": total}


@app.post("/cluster")
def run_cluster(user: CurrentUser = Depends(get_current_user)):
    """Cluster everything captured so far into rabbit holes via the AI layer."""
    rate_limit("cluster", user.id)
    db.ensure_user(user.id, user.email)
    pages = store.pages(user.id)
    searches = store.searches(user.id)
    signature = source_signature(pages, searches)
    empty_signature = source_signature([], [])
    if signature == empty_signature or store.latest_source_signature(user.id) == signature:
        return {
            "holes": [],
            "pages": serialize_pages(pages),
            "searches": serialize_searches(searches),
            "no_change": True,
            "source_signature": signature,
        }
    holes = ai.cluster(pages, searches)
    session_id = pages[-1].sessionId if pages else searches[-1].sessionId if searches else str(uuid.uuid4())
    saved_holes = db.save_holes(user.id, session_id, holes, signature)
    store.remember_source_signature(user.id, signature)
    return {
        "holes": saved_holes or [h.model_dump() for h in holes],
        "pages": serialize_pages(pages),
        "searches": serialize_searches(searches),
        "no_change": False,
        "source_signature": signature,
    }


def source_signature(pages, searches) -> str:
    source = {
        "pages": sorted({(p.url or p.title or "").strip().lower() for p in pages if p.url or p.title}),
        "searches": sorted({(s.query or s.url or "").strip().lower() for s in searches if s.query or s.url}),
    }
    return hashlib.sha256(json.dumps(source, sort_keys=True).encode("utf-8")).hexdigest()


def serialize_pages(pages):
    return [
        {
            "id": f"p{i}",
            "url": p.url,
            "domain": p.domain,
            "title": p.title,
            "at": p.at,
            "referrer": p.referrer,
        }
        for i, p in enumerate(pages)
    ]


def serialize_searches(searches):
    return [
        {
            "id": f"s{i}",
            "query": s.query,
            "engine": s.engine,
            "url": s.url,
            "at": s.at,
        }
        for i, s in enumerate(searches)
    ]


@app.get("/holes")
def holes(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    include_archived: bool = False,
    user: CurrentUser = Depends(get_current_user),
):
    rate_limit("read", user.id)
    db.ensure_user(user.id, user.email)
    return db.list_holes(user.id, limit, offset, include_archived)


@app.patch("/holes/{client_id}")
def patch_hole(client_id: str, req: HoleUpdate, user: CurrentUser = Depends(get_current_user)):
    rate_limit("read", user.id)
    ok = db.update_hole(user.id, client_id, req.favorite, req.archived, req.deleted)
    return {"ok": ok}


@app.post("/holes/bulk")
def bulk_holes(req: BulkHoleAction, user: CurrentUser = Depends(get_current_user)):
    rate_limit("read", user.id)
    updated = db.bulk_update_holes(user.id, req.ids, req.action)
    return {"ok": True, "updated": updated}


@app.post("/ask")
def ask(req: AskRequest, user: CurrentUser = Depends(get_current_user)):
    """Answer a question grounded in one rabbit hole's captured pages."""
    rate_limit("ai", user.id)
    return ai.ask(req.hole, req.question, req.history)


@app.post("/synthesize")
def synthesize(req: SynthesizeRequest, user: CurrentUser = Depends(get_current_user)):
    """Produce a structured research brief for one rabbit hole."""
    rate_limit("ai", user.id)
    return ai.synthesize(req.hole)


@app.get("/signals")
def signals(
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    user: CurrentUser = Depends(get_current_user),
):
    """Inspect what's been captured (debugging / the demo)."""
    rate_limit("read", user.id)
    return {
        "events": [e.model_dump() for e in store.all_events(user.id, limit, offset)],
        "pages": [p.model_dump() for p in store.pages(user.id)],
        "searches": [s.model_dump() for s in store.searches(user.id)],
        "limit": limit,
        "offset": offset,
    }


@app.get("/stats")
def stats(user: CurrentUser = Depends(get_current_user)):
    """Live counters matching the extension popup's page/search/tab metrics."""
    rate_limit("read", user.id)
    events = store.all_events(user.id)
    visits = {e.url for e in events if e.type == "visit" and e.url}
    searches = [e for e in events if e.type == "search"]
    tabs = [e for e in events if e.type == "tab_open"]
    return {
        "pages": len(visits),
        "searches": len(searches),
        "tabs": len(tabs),
        "captureState": "recording",
        "source": "backend",
    }


@app.get("/export")
def export_data(user: CurrentUser = Depends(get_current_user)):
    """Export the signed-in user's captured backend data."""
    rate_limit("read", user.id)
    events = store.all_events(user.id)
    return {
        "user": {"id": user.id, "email": user.email},
        "events": [event.model_dump() for event in events],
        "pages": [p.model_dump() for p in store.pages(user.id)],
        "searches": [s.model_dump() for s in store.searches(user.id)],
        "db": db.status(),
    }


@app.post("/clear")
def clear(req: ClearRequest | None = None, user: CurrentUser = Depends(get_current_user)):
    """Clear the current in-memory capture session."""
    rate_limit("read", user.id)
    store.clear(user.id, req.sessionId if req else None)
    return {"ok": True, "events": 0}
