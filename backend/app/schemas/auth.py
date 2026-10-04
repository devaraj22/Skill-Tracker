import uuid
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.models.enums import Role
from app.schemas.common import ORMModel, StrictIn


def _pw_rules(v: str) -> str:
    if len(v.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 72 bytes")
    if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one letter and one number")
    return v


class RegisterIn(StrictIn):
    email: EmailStr
    password: str = Field(min_length=10, max_length=72)
    full_name: str = Field(min_length=2, max_length=120)
    register_number: str | None = Field(default=None, max_length=40, pattern=r"^[A-Za-z0-9/_-]+$")
    department: str | None = Field(default=None, max_length=100)
    year_of_study: int | None = Field(default=None, ge=1, le=6)

    _pw = field_validator("password")(_pw_rules)

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()

    @field_validator("register_number", "department", mode="before")
    @classmethod
    def _blank(cls, v):
        return (v.strip() or None) if isinstance(v, str) else v


class LoginIn(StrictIn):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    @field_validator("password")
    @classmethod
    def _password_bytes(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return v

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class UserOut(ORMModel):
    id: uuid.UUID
    email: str
    role: Role
    is_active: bool
    full_name: str | None = None
    created_at: datetime
