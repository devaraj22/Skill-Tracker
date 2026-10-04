from fastapi import APIRouter, Query, Response
from sqlalchemy import func, select

from app.api.deps import Admin, DB
from app.models import Achievement, Certification, LearningGoal, Project, Skill, StudentProfile, User
from app.models.enums import CertStatus, GoalStatus, Role
from app.services.activity import log_activity
from app.utils.csv_safe import to_csv

router = APIRouter(prefix="/admin/reports", tags=["admin reports"])

HEADER = ["Full name", "Register number", "Department", "Year", "Account status", "Skills", "Projects", "Achievements",
          "Certificates verified", "Certificates pending", "Goals completed", "Goals total"]


def _count(model, *where):
    return select(func.count()).select_from(model).where(model.user_id == User.id, *where).correlate(User).scalar_subquery()


@router.get("/students.csv")
def students_csv(
    admin: Admin, db: DB, department: str | None = Query(None, max_length=100),
    year: int | None = Query(None, ge=1, le=6), is_active: bool | None = None,
):
    """Aggregate per-student counts. Email addresses and other private details are deliberately excluded."""
    stmt = (
        select(
            StudentProfile.full_name, StudentProfile.register_number, StudentProfile.department, StudentProfile.year_of_study,
            User.is_active, _count(Skill), _count(Project), _count(Achievement),
            _count(Certification, Certification.status == CertStatus.verified),
            _count(Certification, Certification.status == CertStatus.pending),
            _count(LearningGoal, LearningGoal.status == GoalStatus.completed), _count(LearningGoal),
        )
        .join(User, User.id == StudentProfile.user_id).where(User.role == Role.student)
        .order_by(StudentProfile.full_name, User.id)
    )
    if department:
        stmt = stmt.where(StudentProfile.department == department)
    if year:
        stmt = stmt.where(StudentProfile.year_of_study == year)
    if is_active is not None:
        stmt = stmt.where(User.is_active.is_(is_active))
    rows = [(n, rn, d, y, "Active" if act else "Inactive", *counts) for n, rn, d, y, act, *counts in db.execute(stmt).all()]
    log_activity(db, actor_id=admin.id, admin=True, action="report.exported", entity_type="report", summary=f"students.csv ({len(rows)} rows)")
    db.commit()
    return Response(
        to_csv(HEADER, rows), media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="students.csv"', "Cache-Control": "no-store"},
    )
