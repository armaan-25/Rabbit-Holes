import json
import os
from dataclasses import dataclass
from typing import Optional
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

import jwt
from fastapi import Header, HTTPException


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: Optional[str] = None


SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# The shared dev user is a convenience for local work without Supabase. It must
# be opted into explicitly — otherwise a production deploy that's missing its
# Supabase env vars would silently authenticate every request as one shared
# account (fail-open). Default is fail-closed.
ALLOW_DEV_USER = os.environ.get("RABBIT_HOLE_DEV_USER", "").strip().lower() in {"1", "true", "yes"}


def _bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip()


def _from_local_jwt(token: str) -> CurrentUser | None:
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError:
        return None

    sub = payload.get("sub")
    if not sub:
        return None
    return CurrentUser(id=sub, email=payload.get("email"))


def _from_supabase_user(token: str) -> CurrentUser | None:
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        return None

    req = Request(
        f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
        headers={
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {token}",
        },
        method="GET",
    )
    try:
        with urlopen(req, timeout=8) as res:
            user = json.loads(res.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None

    sub = user.get("id") or user.get("sub")
    if not sub:
        return None
    return CurrentUser(id=sub, email=user.get("email"))


def get_current_user(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    """Return the authenticated user.

    Production accepts a valid Supabase access token via local JWT verification
    or Supabase's /auth/v1/user endpoint. When no Supabase auth config is
    present, requests are rejected unless RABBIT_HOLE_DEV_USER is explicitly set
    (local development), so a misconfigured deploy fails closed rather than
    serving every request as one shared account.
    """
    auth_configured = bool(SUPABASE_JWT_SECRET or (SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY))
    if not auth_configured:
        if ALLOW_DEV_USER:
            return CurrentUser(id="dev-user", email="dev@rabbit-hole.local")
        raise HTTPException(status_code=503, detail="Authentication is not configured")

    token = _bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    user = _from_local_jwt(token) or _from_supabase_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired bearer token")

    return user
