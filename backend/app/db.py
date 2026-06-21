import os
from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .schemas import RawEvent, ClusterResult


DATABASE_URL = os.environ.get("DATABASE_URL")
_disabled_reason: str | None = None


def enabled() -> bool:
    return bool(DATABASE_URL) and _disabled_reason is None


def status() -> dict[str, str | bool | None]:
    return {"configured": bool(DATABASE_URL), "available": enabled(), "disabled_reason": _disabled_reason}


def _disable(exc: Exception) -> None:
    global _disabled_reason
    if _disabled_reason is None:
        _disabled_reason = f"{type(exc).__name__}: {exc}"


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


def all_events(user_id: str) -> list[RawEvent]:
    if not enabled():
        return []
    try:
        with connect() as conn:
            rows = conn.execute(
                "select raw from events where user_id = %s order by occurred_at asc, id asc",
                (user_id,),
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


def save_holes(user_id: str, session_id: str, holes: list[ClusterResult]) -> None:
    if not enabled():
        return
    try:
        with connect() as conn:
            ensure_session(user_id, session_id)
            conn.execute(
                "delete from rabbit_holes where user_id = %s and session_id = %s",
                (user_id, session_id),
            )
            for hole in holes:
                conn.execute(
                    """
                    insert into rabbit_holes (
                        user_id, session_id, title, description, topics, questions,
                        entities, page_ids, confidence
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        session_id,
                        hole.title,
                        hole.description,
                        Jsonb(hole.topics),
                        Jsonb(hole.questions),
                        Jsonb([e.model_dump() for e in hole.entities]),
                        Jsonb(hole.page_ids),
                        hole.confidence,
                    ),
                )
    except psycopg.Error:
        return


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
