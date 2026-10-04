import uuid
from datetime import date, datetime

from pydantic import Field, field_validator, model_validator

from app.models.enums import ProjectStatus
from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import OptText, OptUrl


def _tech(v):
    if v is None:
        return v
    cleaned = []
    for item in v:
        item = item.strip()
        if not item or len(item) > 40:
            raise ValueError("Each technology must be 1-40 characters")
        if item.lower() not in [c.lower() for c in cleaned]:
            cleaned.append(item)
    if len(cleaned) > 20:
        raise ValueError("At most 20 technologies")
    return cleaned


class ProjectCreate(StrictIn):
    title: str = Field(min_length=1, max_length=160)
    summary: str = Field(min_length=1, max_length=300)
    description: OptText = Field(default=None, max_length=10000)
    tech_stack: list[str] = Field(default_factory=list)
    repo_url: OptUrl = None
    demo_url: OptUrl = None
    cover_image_url: OptUrl = None
    start_date: date | None = None
    end_date: date | None = None
    status: ProjectStatus = ProjectStatus.in_progress
    is_public: bool = False

    _t = field_validator("tech_stack")(_tech)

    @model_validator(mode="after")
    def _dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("Completion date cannot be before the start date")
        return self


class ProjectUpdate(StrictIn):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    summary: str | None = Field(default=None, min_length=1, max_length=300)
    description: OptText = Field(default=None, max_length=10000)
    tech_stack: list[str] | None = None
    repo_url: OptUrl = None
    demo_url: OptUrl = None
    cover_image_url: OptUrl = None
    start_date: date | None = None
    end_date: date | None = None
    status: ProjectStatus | None = None
    is_public: bool | None = None

    _t = field_validator("tech_stack")(_tech)


class ProjectOut(ORMModel):
    id: uuid.UUID
    title: str
    summary: str
    description: str | None
    tech_stack: list[str]
    repo_url: str | None
    demo_url: str | None
    cover_image_url: str | None
    start_date: date | None
    end_date: date | None
    status: ProjectStatus
    is_public: bool
    position: int
    created_at: datetime
    updated_at: datetime


class ReorderIn(StrictIn):
    ids: list[uuid.UUID] = Field(min_length=1, max_length=200)
