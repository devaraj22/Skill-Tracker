import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.certification import CertificationOut
from app.schemas.common import ORMModel, StrictIn


class AdminStudentOut(ORMModel):
    id: uuid.UUID
    email: str
    full_name: str
    register_number: str | None
    department: str | None
    year_of_study: int | None
    is_active: bool
    created_at: datetime


class StatusIn(StrictIn):
    is_active: bool


class AcademicUpdate(StrictIn):
    register_number: str | None = Field(default=None, max_length=40, pattern=r"^[A-Za-z0-9/_-]+$")
    department: str | None = Field(default=None, max_length=100)
    year_of_study: int | None = Field(default=None, ge=1, le=6)


class AdminStudentDetail(AdminStudentOut):
    counts: dict[str, int]
    skills: list[dict]
    certifications: list[CertificationOut]
    goals: list[dict]
    placement: dict


class ActivityLogOut(ORMModel):
    id: uuid.UUID
    created_at: datetime
    actor_email: str | None
    action: str
    entity_type: str
    entity_id: str | None
    subject_user_id: uuid.UUID | None
    summary: str | None
