import uuid
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import aliased

from app.api.deps import Admin, DB
from app.api.v1.certifications import certificate_file_response
from app.models import ActivityLog, Certification, LearningGoal, Skill, StudentProfile, User, Project, Achievement
from app.models.enums import CertStatus, Role
from app.repositories.common import PageParams, get_owned_or_404, like_pattern, ordering, paginate
from app.schemas.admin import AcademicUpdate, ActivityLogOut, AdminStudentDetail, AdminStudentOut, StatusIn
from app.schemas.certification import AdminCertificationOut, CertificationOut, ReviewIn
from app.schemas.common import Page
from app.services.activity import log_activity
from app.services.analytics import admin_analytics
from app.services.placement import placement_summary

router = APIRouter(prefix="/admin", tags=["admin"])

STUDENT_SORTS = {
    "name": StudentProfile.full_name, "department": StudentProfile.department,
    "year": StudentProfile.year_of_study, "created_at": User.created_at,
}


def _student_row(user: User) -> dict:
    p = user.profile
    return {"id": user.id, "email": user.email, "full_name": p.full_name, "register_number": p.register_number,
            "department": p.department, "year_of_study": p.year_of_study, "is_active": user.is_active, "created_at": user.created_at}


def _get_student(db, student_id: uuid.UUID) -> User:
    user = db.get(User, student_id)
    if user is None or user.role != Role.student or user.profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return user


@router.get("/analytics")
def analytics(_: Admin, db: DB) -> dict:
    return admin_analytics(db)


@router.get("/students", response_model=Page[AdminStudentOut])
def list_students(
    _: Admin, db: DB, params: Annotated[PageParams, Depends()],
    q: str | None = Query(None, max_length=80), department: str | None = Query(None, max_length=100),
    year: int | None = Query(None, ge=1, le=6), is_active: bool | None = None,
    sort: str = "name", order: Literal["asc", "desc"] = "asc",
):
    stmt = select(User).join(StudentProfile, StudentProfile.user_id == User.id).where(User.role == Role.student)
    if q:
        pat = like_pattern(q)
        stmt = stmt.where(or_(StudentProfile.full_name.ilike(pat, escape="\\"), User.email.ilike(pat, escape="\\"), StudentProfile.register_number.ilike(pat, escape="\\")))
    if department:
        stmt = stmt.where(StudentProfile.department == department)
    if year:
        stmt = stmt.where(StudentProfile.year_of_study == year)
    if is_active is not None:
        stmt = stmt.where(User.is_active.is_(is_active))
    users, total = paginate(db, stmt.order_by(ordering(STUDENT_SORTS, sort, order), User.id), params)
    return Page(items=[_student_row(u) for u in users], total=total, page=params.page, page_size=params.page_size)


@router.get("/students/{student_id}", response_model=AdminStudentDetail)
def student_detail(student_id: uuid.UUID, _: Admin, db: DB):
    user = _get_student(db, student_id)
    uid = user.id

    def n(model):
        return len(db.scalars(select(model.id).where(model.user_id == uid)).all())

    certs = db.scalars(select(Certification).where(Certification.user_id == uid).order_by(Certification.created_at.desc())).all()
    skills = db.scalars(select(Skill).where(Skill.user_id == uid).order_by(Skill.name)).all()
    goals = db.scalars(select(LearningGoal).where(LearningGoal.user_id == uid).order_by(LearningGoal.created_at.desc())).all()
    return AdminStudentDetail(
        **_student_row(user),
        counts={"skills": len(skills), "projects": n(Project), "achievements": n(Achievement), "goals": len(goals),
                "certificates": len(certs), "certificates_verified": sum(c.status == CertStatus.verified for c in certs)},
        skills=[{"name": s.name, "category": s.category.value, "level": s.level.value} for s in skills],
        certifications=[CertificationOut.model_validate(c) for c in certs],
        goals=[{"title": g.title, "status": g.status.value, "progress": g.progress, "target_date": g.target_date.isoformat() if g.target_date else None} for g in goals],
        placement=placement_summary(db, uid, user.profile),
    )


@router.patch("/students/{student_id}/status", response_model=AdminStudentOut)
def set_student_status(student_id: uuid.UUID, body: StatusIn, admin: Admin, db: DB):
    user = _get_student(db, student_id)
    if user.is_active != body.is_active:
        user.is_active = body.is_active
        if not body.is_active:
            user.token_version += 1  # end any active session immediately
        log_activity(db, actor_id=admin.id, subject_user_id=user.id, admin=True,
                     action="student.activated" if body.is_active else "student.deactivated",
                     entity_type="user", entity_id=user.id, summary=user.profile.full_name)
        db.commit()
    return _student_row(user)


@router.patch("/students/{student_id}", response_model=AdminStudentOut)
def update_student_academics(student_id: uuid.UUID, body: AcademicUpdate, admin: Admin, db: DB):
    """Administrators manage register number, department and year of study."""
    user = _get_student(db, student_id)
    data = body.model_dump(exclude_unset=True)
    rn = data.get("register_number")
    if rn and db.scalar(select(StudentProfile.id).where(StudentProfile.register_number == rn, StudentProfile.id != user.profile.id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "This register number is already registered")
    for k, v in data.items():
        setattr(user.profile, k, v)
    log_activity(db, actor_id=admin.id, subject_user_id=user.id, admin=True, action="student.academics_updated",
                 entity_type="profile", entity_id=user.profile.id, summary=user.profile.full_name)
    db.commit()
    return _student_row(user)


def _cert_row(c: Certification) -> AdminCertificationOut:
    out = AdminCertificationOut.model_validate({
        **CertificationOut.model_validate(c).model_dump(),
        "student_id": c.user_id, "student_name": c.user.profile.full_name,
        "reviewer_name": c.reviewer.profile.full_name if c.reviewer and c.reviewer.profile else (c.reviewer.email if c.reviewer else None),
    })
    return out


@router.get("/certifications", response_model=Page[AdminCertificationOut])
def certification_queue(
    _: Admin, db: DB, params: Annotated[PageParams, Depends()],
    status_: CertStatus | None = Query(None, alias="status"), q: str | None = Query(None, max_length=80),
    order: Literal["asc", "desc"] = "asc",
):
    stmt = select(Certification).join(StudentProfile, StudentProfile.user_id == Certification.user_id)
    if status_:
        stmt = stmt.where(Certification.status == status_)
    if q:
        pat = like_pattern(q)
        stmt = stmt.where(or_(Certification.title.ilike(pat, escape="\\"), Certification.issuer.ilike(pat, escape="\\"), StudentProfile.full_name.ilike(pat, escape="\\")))
    col = Certification.created_at
    items, total = paginate(db, stmt.order_by(col.asc() if order == "asc" else col.desc(), Certification.id), params)
    return Page(items=[_cert_row(c) for c in items], total=total, page=params.page, page_size=params.page_size)


@router.get("/certifications/{cert_id}/file")
def admin_certificate_file(cert_id: uuid.UUID, admin: Admin, db: DB) -> FileResponse:
    cert = db.get(Certification, cert_id)
    if cert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certification not found")
    log_activity(db, actor_id=admin.id, subject_user_id=cert.user_id, admin=True, action="certificate.file_viewed",
                 entity_type="certification", entity_id=cert.id, summary=cert.title)
    db.commit()
    return certificate_file_response(cert)


@router.patch("/certifications/{cert_id}/review", response_model=AdminCertificationOut)
def review_certification(cert_id: uuid.UUID, body: ReviewIn, admin: Admin, db: DB):
    cert = db.get(Certification, cert_id)
    if cert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certification not found")
    cert.status = body.status
    cert.reviewed_by_id = admin.id
    cert.reviewed_at = datetime.now(timezone.utc)
    cert.review_notes = body.notes
    log_activity(db, actor_id=admin.id, subject_user_id=cert.user_id, admin=True, action=f"certificate.{body.status.value}",
                 entity_type="certification", entity_id=cert.id, summary=cert.title)
    db.commit()
    db.refresh(cert)
    return _cert_row(cert)


@router.get("/activity-logs", response_model=Page[ActivityLogOut])
def activity_logs(
    _: Admin, db: DB, params: Annotated[PageParams, Depends()], action: str | None = Query(None, max_length=60),
):
    stmt = select(ActivityLog).where(ActivityLog.is_admin_action.is_(True))
    if action:
        stmt = stmt.where(ActivityLog.action == action)
    rows, total = paginate(db, stmt.order_by(ActivityLog.created_at.desc(), ActivityLog.id), params)
    items = [ActivityLogOut(id=r.id, created_at=r.created_at, actor_email=r.actor.email if r.actor else None, action=r.action,
                            entity_type=r.entity_type, entity_id=r.entity_id, subject_user_id=r.subject_user_id, summary=r.summary) for r in rows]
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)
