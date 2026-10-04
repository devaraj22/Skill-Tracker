import uuid
from datetime import date, datetime

from pydantic import Field, model_validator

from app.models.enums import CertStatus
from app.schemas.common import ORMModel, StrictIn
from app.utils.validators import OptText, OptUrl


class CertificationCreate(StrictIn):
    title: str = Field(min_length=1, max_length=160)
    issuer: str = Field(min_length=1, max_length=160)
    issue_date: date
    expiry_date: date | None = None
    credential_url: OptUrl = None
    is_public: bool = False

    @model_validator(mode="after")
    def _dates(self):
        if self.expiry_date and self.expiry_date < self.issue_date:
            raise ValueError("Expiry date cannot be before the issue date")
        return self


class CertificationUpdate(StrictIn):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    issuer: str | None = Field(default=None, min_length=1, max_length=160)
    issue_date: date | None = None
    expiry_date: date | None = None
    credential_url: OptUrl = None
    is_public: bool | None = None


class CertificationOut(ORMModel):
    id: uuid.UUID
    title: str
    issuer: str
    issue_date: date
    expiry_date: date | None
    credential_url: str | None
    status: CertStatus
    is_public: bool
    has_file: bool
    file_size: int | None
    reviewed_at: datetime | None
    review_notes: str | None
    created_at: datetime
    updated_at: datetime


class AdminCertificationOut(CertificationOut):
    student_id: uuid.UUID
    student_name: str
    reviewer_name: str | None


class ReviewIn(StrictIn):
    status: CertStatus
    notes: OptText = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _not_pending(self):
        if self.status == CertStatus.pending:
            raise ValueError("A review must set the status to verified or rejected")
        return self
