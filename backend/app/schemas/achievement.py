import uuid
from datetime import date, datetime

from pydantic import Field

from app.models.enums import AchievementType
from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import OptText, OptUrl


class AchievementCreate(StrictIn):
    title: str = Field(min_length=1, max_length=160)
    kind: AchievementType
    organization: str = Field(min_length=1, max_length=160)
    result: OptText = Field(default=None, max_length=160)
    description: OptText = Field(default=None, max_length=2000)
    achieved_on: date
    evidence_url: OptUrl = None
    is_public: bool = False


class AchievementUpdate(StrictIn):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    kind: AchievementType | None = None
    organization: str | None = Field(default=None, min_length=1, max_length=160)
    result: OptText = Field(default=None, max_length=160)
    description: OptText = Field(default=None, max_length=2000)
    achieved_on: date | None = None
    evidence_url: OptUrl = None
    is_public: bool | None = None


class AchievementOut(ORMModel):
    id: uuid.UUID
    title: str
    kind: AchievementType
    organization: str
    result: str | None
    description: str | None
    achieved_on: date
    evidence_url: str | None
    is_public: bool
    created_at: datetime
    updated_at: datetime
