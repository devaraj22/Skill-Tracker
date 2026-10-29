"""Pydantic schemas for SkillAssessment."""
import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import SkillCategory
from app.schemas.common import ORMModel, StrictIn


class SkillAssessmentOut(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    skill_name: str
    category: SkillCategory
    score: float
    max_score: float
    percent: float
    assessed_by_id: uuid.UUID | None
    assessed_at: datetime
    feedback: str | None
    created_at: datetime


class SkillAssessmentCreate(StrictIn):
    skill_name: str = Field(min_length=1, max_length=80)
    category: SkillCategory
    score: float = Field(ge=0)
    max_score: float = Field(gt=0)
    feedback: str | None = Field(default=None, max_length=2000)

    # Optional: faculty submitting on behalf of a student will supply user_id.
    # Students submitting for themselves leave this None (set server-side).
    student_id: uuid.UUID | None = None
