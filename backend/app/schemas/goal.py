import uuid
from datetime import date, datetime

from pydantic import Field

from app.models.enums import GoalStatus, Priority, SkillCategory
from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import OptText


class GoalCreate(StrictIn):
    title: str = Field(min_length=1, max_length=160)
    description: OptText = Field(default=None, max_length=1000)
    category: SkillCategory
    priority: Priority = Priority.medium
    target_date: date | None = None
    progress: int = Field(default=0, ge=0, le=100)
    status: GoalStatus = GoalStatus.not_started


class GoalUpdate(StrictIn):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: OptText = Field(default=None, max_length=1000)
    category: SkillCategory | None = None
    priority: Priority | None = None
    target_date: date | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    status: GoalStatus | None = None


class GoalOut(ORMModel):
    id: uuid.UUID
    title: str
    description: str | None
    category: SkillCategory
    priority: Priority
    target_date: date | None
    progress: int
    status: GoalStatus
    is_overdue: bool
    created_at: datetime
    updated_at: datetime
