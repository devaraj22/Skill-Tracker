import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import SkillCategory, SkillLevel
from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import OptText, OptUrl


class SkillCreate(StrictIn):
    name: str = Field(min_length=1, max_length=80)
    category: SkillCategory
    level: SkillLevel
    evidence_url: OptUrl = None
    notes: OptText = Field(default=None, max_length=1000)
    is_public: bool = True


class SkillUpdate(StrictIn):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    category: SkillCategory | None = None
    level: SkillLevel | None = None
    evidence_url: OptUrl = None
    notes: OptText = Field(default=None, max_length=1000)
    is_public: bool | None = None


class SkillOut(ORMModel):
    id: uuid.UUID
    name: str
    category: SkillCategory
    level: SkillLevel
    evidence_url: str | None
    notes: str | None
    is_public: bool
    created_at: datetime
    updated_at: datetime
