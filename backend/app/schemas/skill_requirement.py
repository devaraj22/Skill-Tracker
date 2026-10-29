"""Pydantic schemas for DepartmentSkillRequirement."""
import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import SkillCategory, SkillLevel
from app.schemas.common import ORMModel, StrictIn


class SkillRequirementOut(ORMModel):
    id: uuid.UUID
    department_id: uuid.UUID
    skill_name: str
    category: SkillCategory
    target_level: SkillLevel
    study_year: int | None
    weight: float
    is_required: bool
    created_at: datetime
    updated_at: datetime


class SkillRequirementCreate(StrictIn):
    skill_name: str = Field(min_length=1, max_length=80)
    category: SkillCategory
    target_level: SkillLevel
    study_year: int | None = Field(default=None, ge=1, le=6)
    weight: float = Field(default=1.0, gt=0)
    is_required: bool = True


class SkillRequirementUpdate(StrictIn):
    skill_name: str | None = Field(default=None, min_length=1, max_length=80)
    category: SkillCategory | None = None
    target_level: SkillLevel | None = None
    study_year: int | None = Field(default=None, ge=1, le=6)
    weight: float | None = Field(default=None, gt=0)
    is_required: bool | None = None
