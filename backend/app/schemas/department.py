"""Pydantic schemas for the Department resource."""
import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import SchoolGroup
from app.schemas.common import ORMModel, StrictIn


class DepartmentOut(ORMModel):
    id: uuid.UUID
    code: str
    name: str
    school_group: SchoolGroup
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DepartmentCreate(StrictIn):
    code: str = Field(min_length=2, max_length=20, pattern=r"^[A-Z0-9_-]+$")
    name: str = Field(min_length=2, max_length=120)
    school_group: SchoolGroup
    is_active: bool = True


class DepartmentUpdate(StrictIn):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    school_group: SchoolGroup | None = None
    is_active: bool | None = None


class StaffAssignmentOut(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    department_id: uuid.UUID
    assignment_role: str
    is_active: bool
    # denormalised for display
    user_email: str | None = None
    user_name: str | None = None
    department_name: str | None = None
    created_at: datetime


class StaffAssignmentCreate(StrictIn):
    user_id: uuid.UUID
    department_id: uuid.UUID
    assignment_role: str = Field(pattern=r"^(faculty|coordinator)$")


class StaffAssignmentUpdate(StrictIn):
    is_active: bool
