"""Event store.

Uses Postgres when DATABASE_URL is configured; otherwise falls back to the
original in-memory store for local demos.
"""

from .schemas import RawEvent
from . import db

_events_by_user: dict[str, list[RawEvent]] = {}
_last_signature_by_user: dict[str, str] = {}


def add_events(events: list[RawEvent], user_id: str = "dev-user") -> int:
    if db.enabled():
        total = db.add_events(user_id, events)
        if db.enabled():
            return total
    user_events = _events_by_user.setdefault(user_id, [])
    user_events.extend(events)
    return len(user_events)


def all_events(user_id: str = "dev-user", limit: int | None = None, offset: int = 0) -> list[RawEvent]:
    if db.enabled():
        return db.all_events(user_id, limit, offset)
    events = list(_events_by_user.get(user_id, []))
    return events[offset : offset + limit] if limit is not None else events


def pages(user_id: str = "dev-user") -> list[RawEvent]:
    """Distinct page visits, most recent title kept per URL."""
    if db.enabled():
        return db.pages(user_id)
    by_url: dict[str, RawEvent] = {}
    for e in _events_by_user.get(user_id, []):
        if e.type in ("visit", "title") and e.url:
            existing = by_url.get(e.url)
            if existing is None:
                by_url[e.url] = e
            elif e.type == "title" and e.title:
                existing.title = e.title
    return list(by_url.values())


def searches(user_id: str = "dev-user") -> list[RawEvent]:
    if db.enabled():
        return db.searches(user_id)
    return [e for e in _events_by_user.get(user_id, []) if e.type == "search"]


def clear(user_id: str = "dev-user", session_id: str | None = None) -> None:
    if db.enabled():
        db.clear(user_id, session_id)
        return
    if session_id:
        _events_by_user[user_id] = [e for e in _events_by_user.get(user_id, []) if e.sessionId != session_id]
    else:
        _events_by_user[user_id] = []


def latest_source_signature(user_id: str = "dev-user") -> str | None:
    if db.enabled():
        return db.latest_source_signature(user_id)
    return _last_signature_by_user.get(user_id)


def remember_source_signature(user_id: str, signature: str) -> None:
    _last_signature_by_user[user_id] = signature
