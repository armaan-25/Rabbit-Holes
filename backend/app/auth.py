import os
from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Header, HTTPException


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: Optional[str] = None


SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")


def get_current_user(authorization: Optional[str] = Header(default=None)) -> CurrentUser:
    """Return the authenticated user.

    Local development intentionally falls back to one stable demo user when
    SUPABASE_JWT_SECRET is not configured. Production should set the secret so
    every request is scoped to a real Supabase Auth user.
    """
    if not SUPABASE_JWT_SECRET:
        return CurrentUser(id="dev-user", email="dev@rabbit-hole.local")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from exc

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token missing subject")

    return CurrentUser(id=sub, email=payload.get("email"))
