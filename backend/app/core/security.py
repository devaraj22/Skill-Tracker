"""Password hashing, JWT creation/validation and CSRF token helpers."""
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
# Pre-computed hash used to keep login timing similar when the email is unknown.
_DUMMY_HASH = bcrypt.hashpw(b"not-a-real-password", bcrypt.gensalt())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    hashed = password_hash.encode("utf-8") if password_hash else _DUMMY_HASH
    try:
        ok = bcrypt.checkpw(password.encode("utf-8")[:72], hashed)
    except ValueError:
        return False
    return ok and password_hash is not None


def create_access_token(user_id: uuid.UUID, token_version: int) -> str:
    s = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "tv": token_version,
        "iat": now,
        "exp": now + timedelta(minutes=s.access_token_minutes),
    }
    return jwt.encode(payload, s.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Return the payload, or None if the token is invalid or expired."""
    try:
        return jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]})
    except jwt.PyJWTError:
        return None


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)
