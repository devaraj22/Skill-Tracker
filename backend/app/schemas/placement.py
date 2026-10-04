import uuid
from datetime import date, datetime

from pydantic import Field, model_validator

from app.models.enums import PlacementCategory
from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import OptText


class AssessmentCreate(StrictIn):
    category: PlacementCategory
    title: str = Field(min_length=1, max_length=160)
    score: float = Field(ge=0, le=100000, allow_inf_nan=False)
    max_score: float = Field(gt=0, le=100000, allow_inf_nan=False)
    assessed_on: date
    notes: OptText = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _score_le_max(self):
        if self.score > self.max_score:
            raise ValueError("Score cannot exceed the maximum score")
        return self


class AssessmentUpdate(StrictIn):
    category: PlacementCategory | None = None
    title: str | None = Field(default=None, min_length=1, max_length=160)
    score: float | None = Field(default=None, ge=0, le=100000, allow_inf_nan=False)
    max_score: float | None = Field(default=None, gt=0, le=100000, allow_inf_nan=False)
    assessed_on: date | None = None
    notes: OptText = Field(default=None, max_length=1000)


class AssessmentOut(ORMModel):
    id: uuid.UUID
    category: PlacementCategory
    title: str
    score: float
    max_score: float
    percent: float
    assessed_on: date
    notes: str | None
    created_at: datetime
