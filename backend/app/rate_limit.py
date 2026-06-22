import os
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import HTTPException


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

_hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def check(limit_name: str, user_id: str) -> None:
    limit = LIMITS[limit_name]
    now = time.time()
    key = (limit_name, user_id)
    hits = _hits[key]
    cutoff = now - limit.window_seconds
    while hits and hits[0] < cutoff:
        hits.popleft()
    if len(hits) >= limit.max_calls:
        retry_after = max(1, int(limit.window_seconds - (now - hits[0])))
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {limit_name}",
            headers={"Retry-After": str(retry_after)},
        )
    hits.append(now)
