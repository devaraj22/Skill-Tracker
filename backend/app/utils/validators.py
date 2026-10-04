"""Reusable input validators shared by all schemas."""
import re
from typing import Annotated
from urllib.parse import urlparse

from pydantic import AfterValidator, BeforeValidator


def _blank_to_none(v):
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


def _check_http_url(v: str | None) -> str | None:
    if v is None:
        return None
    if len(v) > 500:
        raise ValueError("URL must be 500 characters or fewer")
    parsed = urlparse(v)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or " " in v:
        raise ValueError("Enter a valid http(s) URL")
    return v


# Optional http/https URL; empty strings become None; javascript:/data: URLs are rejected.
OptUrl = Annotated[str | None, BeforeValidator(_blank_to_none), AfterValidator(_check_http_url)]
OptText = Annotated[str | None, BeforeValidator(_blank_to_none)]

USERNAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,29}$")
RESERVED_USERNAMES = {"admin", "api", "login", "register", "portfolio", "dashboard", "me"}
