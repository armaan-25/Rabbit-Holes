import os
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import HTTPException

from . import db


@dataclass(frozen=True)
class Limit:
    max_calls: int
    window_seconds: int


LIMITS = {
    "events": Limit(int(os.environ.get("RATE_LIMIT_EVENTS_PER_MIN", "240")), 60),
    "cluster": Limit(int(os.environ.get("RATE_LIMIT_CLUSTER_PER_HOUR", "20")), 3600),
    "ai": Limit(int(os.environ.get("RATE_LIMIT_AI_PER_HOUR", "60")), 3600),
    "read": Limit(int(os.environ.get("RATE_LIMIT_READS_PER_MIN", "120")), 60),
}

# Per-process sliding-window fallback, used only when no shared DB is configured
# (local dev). With DATABASE_URL set, limits live in Postgres so they're shared
# across instances and survive restarts.
_hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def _reject(limit_name: str, retry_after: float) -> None:
    raise HTTPException(
        status_code=429,
        detail=f"Rate limit exceeded for {limit_name}",
        headers={"Retry-After": str(max(1, int(retry_after)))},
    )


def _check_memory(limit_name: str, user_id: str, limit: Limit, now: float) -> None:
    key = (limit_name, user_id)
    hits = _hits[key]
    cutoff = now - limit.window_seconds
    while hits and hits[0] < cutoff:
        hits.popleft()
    if len(hits) >= limit.max_calls:
        _reject(limit_name, limit.window_seconds - (now - hits[0]))
    hits.append(now)


def check(limit_name: str, user_id: str) -> None:
    limit = LIMITS[limit_name]
    now = time.time()

    # Durable, cross-instance fixed-window counter in Postgres. Falls back to the
    # in-memory limiter if the DB is unconfigured or briefly unavailable.
    window_start = int(now // limit.window_seconds) * limit.window_seconds
    count = db.rate_limit_hit(limit_name, user_id, window_start)
    if count is None:
        _check_memory(limit_name, user_id, limit, now)
        return
    if count > limit.max_calls:
        _reject(limit_name, window_start + limit.window_seconds - now)
