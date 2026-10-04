import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select

from app.api.deps import DB, Student
from app.models import Certification
from app.models.enums import CertStatus
from app.repositories.common import PageParams, apply_update, get_owned_or_404, like_pattern, ordering, paginate
from app.schemas.certification import CertificationCreate, CertificationOut, CertificationUpdate
from app.schemas.common import Page
from app.services import files
from app.services.activity import log_activity

router = APIRouter(prefix="/certifications", tags=["certifications"])

SORTS = {"created_at": Certification.created_at, "issue_date": Certification.issue_date, "title": Certification.title, "status": Certification.status}
REVIEW_RESET_FIELDS = {"title", "issuer", "issue_date", "expiry_date", "credential_url"}


def reset_review(cert: Certification) -> None:
    """Changing the evidence or key details invalidates a previous review; the certificate must be re-reviewed."""
    cert.status = CertStatus.pending
    cert.reviewed_by_id = None
    cert.reviewed_at = None
    cert.review_notes = None


@router.get("", response_model=Page[CertificationOut])
def list_certifications(
    user: Student, db: DB, params: Annotated[PageParams, Depends()],
    q: str | None = Query(None, max_length=80), status_: CertStatus | None = Query(None, alias="status"),
    sort: str = "created_at", order: Literal["asc", "desc"] = "desc",
):
    stmt = select(Certification).where(Certification.user_id == user.id)
    if q:
        stmt = stmt.where(or_(Certification.title.ilike(like_pattern(q), escape="\\"), Certification.issuer.ilike(like_pattern(q), escape="\\")))
    if status_:
        stmt = stmt.where(Certification.status == status_)
    items, total = paginate(db, stmt.order_by(ordering(SORTS, sort, order), Certification.id), params)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.post("", response_model=CertificationOut, status_code=status.HTTP_201_CREATED)
def create_certification(body: CertificationCreate, user: Student, db: DB):
    cert = Certification(user_id=user.id, **body.model_dump())
    db.add(cert)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="certificate.submitted", entity_type="certification", entity_id=cert.id, summary=cert.title)
    db.commit()
    return cert


@router.patch("/{cert_id}", response_model=CertificationOut)
def update_certification(cert_id: uuid.UUID, body: CertificationUpdate, user: Student, db: DB):
    cert = get_owned_or_404(db, Certification, cert_id, user.id, "Certification")
    data = body.model_dump(exclude_unset=True)
    apply_update(cert, data, {"title", "issuer", "issue_date", "is_public"})
    if cert.expiry_date and cert.expiry_date < cert.issue_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Expiry date cannot be before the issue date")
    if REVIEW_RESET_FIELDS & data.keys() and cert.status != CertStatus.pending:
        reset_review(cert)
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="certificate.updated", entity_type="certification", entity_id=cert.id, summary=cert.title)
    db.commit()
    return cert


@router.delete("/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(cert_id: uuid.UUID, user: Student, db: DB):
    cert = get_owned_or_404(db, Certification, cert_id, user.id, "Certification")
    key = cert.file_key
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="certificate.deleted", entity_type="certification", entity_id=cert.id, summary=cert.title)
    db.delete(cert)
    db.commit()
    files.delete_file(key)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{cert_id}/file", response_model=CertificationOut)
def upload_certificate_file(cert_id: uuid.UUID, user: Student, db: DB, file: UploadFile = File(...)):
    """Attach (or replace) the evidence document. Replacing evidence sends the certificate back to review."""
    cert = get_owned_or_404(db, Certification, cert_id, user.id, "Certification")
    key, mime, size = files.save_certificate_file(file)
    old = cert.file_key
    cert.file_key, cert.file_mime, cert.file_size = key, mime, size
    if cert.status != CertStatus.pending:
        reset_review(cert)
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="certificate.file_uploaded", entity_type="certification", entity_id=cert.id, summary=cert.title)
    db.commit()
    files.delete_file(old)
    return cert


@router.get("/{cert_id}/file")
def download_certificate_file(cert_id: uuid.UUID, user: Student, db: DB):
    cert = get_owned_or_404(db, Certification, cert_id, user.id, "Certification")
    return certificate_file_response(cert)


@router.delete("/{cert_id}/file", status_code=status.HTTP_204_NO_CONTENT)
def remove_certificate_file(cert_id: uuid.UUID, user: Student, db: DB):
    cert = get_owned_or_404(db, Certification, cert_id, user.id, "Certification")
    old = cert.file_key
    cert.file_key = cert.file_mime = cert.file_size = None
    if cert.status != CertStatus.pending:
        reset_review(cert)
    db.commit()
    files.delete_file(old)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def certificate_file_response(cert: Certification) -> FileResponse:
    if not cert.file_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No file uploaded for this certificate")
    ext = ".pdf" if cert.file_mime == "application/pdf" else (".png" if cert.file_mime == "image/png" else ".jpg")
    return FileResponse(
        files.file_path(cert.file_key), media_type=cert.file_mime, filename=f"certificate-{str(cert.id)[:8]}{ext}",
        content_disposition_type="attachment", headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"},
    )
