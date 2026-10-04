import uuid
from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator, model_validator

from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import RESERVED_USERNAMES, USERNAME_RE, OptText, OptUrl

Section = Literal["skills", "projects", "certifications", "achievements", "resume"]


class ProfileOut(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    full_name: str
    register_number: str | None
    department: str | None
    year_of_study: int | None
    avatar_url: str | None
    bio: str | None
    github_url: str | None
    linkedin_url: str | None
    resume_url: str | None
    portfolio_username: str | None
    portfolio_public: bool
    portfolio_sections: list[str]
    completion_percent: int
    updated_at: datetime


class ProfileUpdate(StrictIn):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    register_number: str | None = Field(default=None, max_length=40, pattern=r"^[A-Za-z0-9/_-]+$")
    department: OptText = Field(default=None, max_length=100)
    year_of_study: int | None = Field(default=None, ge=1, le=6)
    avatar_url: OptUrl = None
    bio: OptText = Field(default=None, max_length=600)
    github_url: OptUrl = None
    linkedin_url: OptUrl = None
    resume_url: OptUrl = None
    portfolio_username: str | None = None
    portfolio_public: bool | None = None
    portfolio_sections: list[Section] | None = None

    @field_validator("portfolio_username", mode="before")
    @classmethod
    def _username(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        v = str(v).strip().lower()
        if not USERNAME_RE.match(v) or v in RESERVED_USERNAMES:
            raise ValueError("Username must be 3-30 characters: lowercase letters, numbers and hyphens, starting with a letter or number")
        return v

    @model_validator(mode="after")
    def _github_host(self):
        for field, host in (("github_url", "github.com"), ("linkedin_url", "linkedin.com")):
            url = getattr(self, field)
            if url:
                from urllib.parse import urlparse
                h = (urlparse(url).hostname or "").lower()
                if not (h == host or h.endswith("." + host)):
                    raise ValueError(f"{field} must be a {host} link")
        return self
