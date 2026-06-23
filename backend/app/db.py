import os
import re
from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .schemas import RawEvent, ClusterResult


DATABASE_URL = os.environ.get("DATABASE_URL")
_disabled_reason: str | None = None
_schema_checked = False


def enabled() -> bool:
    return bool(DATABASE_URL) and _disabled_reason is None


def status() -> dict[str, str | bool | None]:
    return {"configured": bool(DATABASE_URL), "available": enabled(), "disabled_reason": _disabled_reason}


def _disable(exc: Exception) -> None:
    global _disabled_reason
    if _disabled_reason is None:
        _disabled_reason = f"{type(exc).__name__}: {exc}"


def ensure_schema() -> None:
    """Create the minimal production tables if the configured DB is empty."""
    global _schema_checked
    if not enabled() or _schema_checked:
        return
    try:
        with connect() as conn:
            conn.execute(
                """
                create table if not exists app_users (
                    id text primary key,
                    email text,
                    created_at timestamptz not null default now()
                )
                """
            )
            conn.execute(
                """
                create table if not exists sessions (
                    id text primary key,
                    user_id text not null references app_users(id) on delete cascade,
                    status text not null default 'recording',
                    started_at timestamptz not null default now(),
                    ended_at timestamptz
                )
                """
            )
            conn.execute(
                """
                create table if not exists events (
                    id bigserial primary key,
                    user_id text not null references app_users(id) on delete cascade,
                    session_id text not null references sessions(id) on delete cascade,
                    type text not null,
                    url text,
                    domain text,
                    title text,
                    query text,
                    engine text,
                    referrer text,
                    transition text,
                    tab_id integer,
                    occurred_at timestamptz not null,
                    raw jsonb not null,
                    created_at timestamptz not null default now()
                )
                """
            )
            conn.execute("create index if not exists events_user_time_idx on events(user_id, occurred_at, id)")
            conn.execute("create index if not exists events_user_session_idx on events(user_id, session_id)")
            conn.execute(
                """
                create table if not exists rabbit_holes (
                    id bigserial primary key,
                    user_id text not null references app_users(id) on delete cascade,
                    session_id text not null references sessions(id) on delete cascade,
                    title text not null,
                    description text not null default '',
                    topics jsonb not null default '[]'::jsonb,
                    questions jsonb not null default '[]'::jsonb,
                    entities jsonb not null default '[]'::jsonb,
                    page_ids jsonb not null default '[]'::jsonb,
                    confidence double precision not null default 0,
                    created_at timestamptz not null default now()
                )
                """
            )
            conn.execute("create index if not exists rabbit_holes_user_session_idx on rabbit_holes(user_id, session_id)")
            conn.execute("alter table sessions add column if not exists source_signature text")
            conn.execute("alter table rabbit_holes add column if not exists client_id text")
            conn.execute("alter table rabbit_holes add column if not exists favorite boolean not null default false")
            conn.execute("alter table rabbit_holes add column if not exists archived boolean not null default false")
            conn.execute("alter table rabbit_holes add column if not exists deleted_at timestamptz")
            conn.execute("create index if not exists sessions_user_started_idx on sessions(user_id, started_at desc)")
            conn.execute("create index if not exists rabbit_holes_user_client_idx on rabbit_holes(user_id, client_id)")
            conn.execute(
                """
                create table if not exists rate_limit_hits (
                    bucket text not null,
                    user_id text not null,
                    window_start bigint not null,
                    count integer not null default 0,
                    primary key (bucket, user_id, window_start)
                )
                """
            )
        _schema_checked = True
    except psycopg.Error:
        return


def rate_limit_hit(bucket: str, user_id: str, window_start: int) -> int | None:
    """Atomically count one request in a fixed window and return the running total.

    Shared across processes and durable across restarts (unlike the in-memory
    fallback). Returns None when the DB is unavailable so the caller can fall
    back. Prunes the key's expired windows in the same transaction so the table
    only ever holds the current window per (bucket, user)."""
    if not enabled():
        return None
    ensure_schema()
    try:
        with connect() as conn:
            conn.execute(
                "delete from rate_limit_hits where bucket = %s and user_id = %s and window_start < %s",
                (bucket, user_id, window_start),
            )
            row = conn.execute(
                """
                insert into rate_limit_hits (bucket, user_id, window_start, count)
                values (%s, %s, %s, 1)
                on conflict (bucket, user_id, window_start)
                do update set count = rate_limit_hits.count + 1
                returning count
                """,
                (bucket, user_id, window_start),
            ).fetchone()
        return int(row["count"]) if row else None
    except psycopg.Error:
        return None


@contextmanager
def connect() -> Iterator[psycopg.Connection]:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    try:
        with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
            yield conn
    except psycopg.Error as exc:
        _disable(exc)
        raise


def ensure_user(user_id: str, email: str | None = None) -> None:
    if not enabled():
        return
    ensure_schema()
    try:
        with connect() as conn:
            conn.execute(
                """
                insert into app_users (id, email)
                values (%s, %s)
                on conflict (id) do update set email = coalesce(excluded.email, app_users.email)
                """,
                (user_id, email),
            )
    except psycopg.Error:
        return


def ensure_session(user_id: str, session_id: str) -> None:
    if not enabled():
        return
    try:
        with connect() as conn:
            conn.execute(
                """
                insert into sessions (id, user_id, status)
                values (%s, %s, 'recording')
                on conflict (id) do nothing
                """,
                (session_id, user_id),
            )
    except psycopg.Error:
        return


def add_events(user_id: str, events: list[RawEvent]) -> int:
    if not enabled() or not events:
        return 0
    try:
        with connect() as conn:
            for event in events:
                ensure_session(user_id, event.sessionId)
                conn.execute(
                    """
                    insert into events (
                        user_id, session_id, type, url, domain, title, query, engine,
                        referrer, transition, tab_id, occurred_at, raw
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        event.sessionId,
                        event.type,
                        event.url,
                        event.domain,
                        event.title,
                        event.query,
                        event.engine,
                        event.referrer,
                        event.transition,
                        event.tabId,
                        event.at,
                        Jsonb(event.model_dump()),
                    ),
                )
            row = conn.execute("select count(*) as n from events where user_id = %s", (user_id,)).fetchone()
            return int(row["n"])
    except psycopg.Error:
        return 0


def all_events(user_id: str, limit: int | None = None, offset: int = 0) -> list[RawEvent]:
    if not enabled():
        return []
    ensure_schema()
    try:
        with connect() as conn:
            if limit is None:
                rows = conn.execute(
                    "select raw from events where user_id = %s order by occurred_at asc, id asc",
                    (user_id,),
                ).fetchall()
            else:
                rows = conn.execute(
                    "select raw from events where user_id = %s order by occurred_at asc, id asc limit %s offset %s",
                    (user_id, limit, offset),
                ).fetchall()
        return [RawEvent(**row["raw"]) for row in rows]
    except psycopg.Error:
        return []


def pages(user_id: str) -> list[RawEvent]:
    by_url: dict[str, RawEvent] = {}
    for event in all_events(user_id):
        if event.type in ("visit", "title") and event.url:
            existing = by_url.get(event.url)
            if existing is None:
                by_url[event.url] = event
            elif event.type == "title" and event.title:
                existing.title = event.title
    return list(by_url.values())


def searches(user_id: str) -> list[RawEvent]:
    return [event for event in all_events(user_id) if event.type == "search"]


def _hole_client_id(hole: ClusterResult) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", hole.title.lower()).strip("-")
    suffix = hole.page_ids[0] if hole.page_ids else "root"
    return f"{base or 'rabbit-hole'}-{suffix}"


def latest_source_signature(user_id: str) -> str | None:
    if not enabled():
        return None
    ensure_schema()
    try:
        with connect() as conn:
            row = conn.execute(
                """
                select source_signature from sessions
                where user_id = %s and source_signature is not null
                order by started_at desc
                limit 1
                """,
                (user_id,),
            ).fetchone()
        return str(row["source_signature"]) if row and row["source_signature"] else None
    except psycopg.Error:
        return None


def save_holes(user_id: str, session_id: str, holes: list[ClusterResult], source_signature: str | None = None) -> list[dict]:
    if not enabled():
        return []
    try:
        with connect() as conn:
            ensure_session(user_id, session_id)
            if source_signature:
                conn.execute(
                    "update sessions set source_signature = %s where user_id = %s and id = %s",
                    (source_signature, user_id, session_id),
                )
            conn.execute(
                "delete from rabbit_holes where user_id = %s and session_id = %s",
                (user_id, session_id),
            )
            saved: list[dict] = []
            for hole in holes:
                client_id = _hole_client_id(hole)
                conn.execute(
                    """
                    insert into rabbit_holes (
                        user_id, session_id, client_id, title, description, topics, questions,
                        entities, page_ids, confidence
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        session_id,
                        client_id,
                        hole.title,
                        hole.description,
                        Jsonb(hole.topics),
                        Jsonb(hole.questions),
                        Jsonb([e.model_dump() for e in hole.entities]),
                        Jsonb(hole.page_ids),
                        hole.confidence,
                    ),
                )
                saved.append({**hole.model_dump(), "client_id": client_id})
            return saved
    except psycopg.Error:
        return []


def list_holes(user_id: str, limit: int = 50, offset: int = 0, include_archived: bool = False) -> dict:
    if not enabled():
        return {"holes": [], "total": 0, "limit": limit, "offset": offset}
    ensure_schema()
    where = "user_id = %s and deleted_at is null"
    params: list[object] = [user_id]
    if not include_archived:
        where += " and archived = false"
    try:
        with connect() as conn:
            total_row = conn.execute(f"select count(*) as n from rabbit_holes where {where}", params).fetchone()
            rows = conn.execute(
                f"""
                select client_id, title, description, topics, questions, entities, page_ids,
                       confidence, favorite, archived, created_at
                from rabbit_holes
                where {where}
                order by created_at desc, id desc
                limit %s offset %s
                """,
                [*params, limit, offset],
            ).fetchall()
        holes = [
            {
                "client_id": row["client_id"],
                "title": row["title"],
                "description": row["description"],
                "topics": row["topics"],
                "questions": row["questions"],
                "entities": row["entities"],
                "page_ids": row["page_ids"],
                "confidence": row["confidence"],
                "favorite": row["favorite"],
                "archived": row["archived"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
            for row in rows
        ]
        return {"holes": holes, "total": int(total_row["n"]), "limit": limit, "offset": offset}
    except psycopg.Error:
        return {"holes": [], "total": 0, "limit": limit, "offset": offset}


def update_hole(user_id: str, client_id: str, favorite: bool | None = None, archived: bool | None = None, deleted: bool | None = None) -> bool:
    if not enabled():
        return False
    ensure_schema()
    updates: list[str] = []
    params: list[object] = []
    if favorite is not None:
        updates.append("favorite = %s")
        params.append(favorite)
    if archived is not None:
        updates.append("archived = %s")
        params.append(archived)
    if deleted is not None:
        updates.append("deleted_at = case when %s then now() else null end")
        params.append(deleted)
    if not updates:
        return True
    try:
        with connect() as conn:
            row = conn.execute(
                f"update rabbit_holes set {', '.join(updates)} where user_id = %s and client_id = %s returning id",
                [*params, user_id, client_id],
            ).fetchone()
        return row is not None
    except psycopg.Error:
        return False


def bulk_update_holes(user_id: str, client_ids: list[str], action: str) -> int:
    if not enabled() or not client_ids:
        return 0
    patch = {
        "favorite": (True, None, None),
        "unfavorite": (False, None, None),
        "archive": (None, True, None),
        "restore": (None, False, False),
        "delete": (None, None, True),
    }.get(action)
    if patch is None:
        return 0
    return sum(1 for client_id in client_ids if update_hole(user_id, client_id, *patch))


def clear(user_id: str, session_id: str | None = None) -> None:
    if not enabled():
        return
    try:
        with connect() as conn:
            if session_id:
                conn.execute("delete from rabbit_holes where user_id = %s and session_id = %s", (user_id, session_id))
                conn.execute("delete from events where user_id = %s and session_id = %s", (user_id, session_id))
                conn.execute("update sessions set status = 'stopped', ended_at = now() where user_id = %s and id = %s", (user_id, session_id))
            else:
                conn.execute("delete from rabbit_holes where user_id = %s", (user_id,))
                conn.execute("delete from events where user_id = %s", (user_id,))
                conn.execute("update sessions set status = 'stopped', ended_at = now() where user_id = %s", (user_id,))
    except psycopg.Error:
        return
