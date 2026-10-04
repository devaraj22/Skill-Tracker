"""Administrator aggregates. Everything is computed from stored rows; no student-level private data."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Certification, LearningGoal, PlacementAssessment, Skill, StudentProfile, User
from app.models.enums import Role
from app.services.placement import LABELS


def admin_analytics(db: Session) -> dict:
    def count_students(active: bool) -> int:
        return db.scalar(select(func.count()).select_from(User).where(User.role == Role.student, User.is_active.is_(active))) or 0

    active, inactive = count_students(True), count_students(False)

    def grouped(col):
        return db.execute(
            select(col, func.count()).join(User, User.id == StudentProfile.user_id)
            .where(User.role == Role.student).group_by(col).order_by(col)
        ).all()

    avg_pct = func.avg(PlacementAssessment.score * 100.0 / PlacementAssessment.max_score)
    placement = db.execute(
        select(PlacementAssessment.category, avg_pct, func.count(), func.count(func.distinct(PlacementAssessment.user_id)))
        .group_by(PlacementAssessment.category)
    ).all()
    goal_rows = db.execute(select(LearningGoal.status, func.count()).group_by(LearningGoal.status)).all()
    goal_avg = db.scalar(select(func.avg(LearningGoal.progress)))
    return {
        "students": {"active": active, "inactive": inactive, "total": active + inactive},
        "by_department": [{"department": d or "Unspecified", "count": n} for d, n in grouped(StudentProfile.department)],
        "by_year": [{"year": y, "count": n} for y, n in grouped(StudentProfile.year_of_study)],
        "certifications": {s.value: n for s, n in db.execute(select(Certification.status, func.count()).group_by(Certification.status)).all()},
        "skill_distribution": [{"category": c.value, "count": n} for c, n in db.execute(select(Skill.category, func.count()).group_by(Skill.category)).all()],
        "learning": {
            "total_goals": sum(n for _, n in goal_rows),
            "average_progress": round(float(goal_avg), 1) if goal_avg is not None else None,
            "by_status": {s.value: n for s, n in goal_rows},
        },
        "placement": [
            {"category": c.value, "label": LABELS[c], "average_percent": round(float(a), 1), "assessments": n, "students": s}
            for c, a, n, s in placement
        ],
        "placement_note": "Average of all recorded assessment percentages per category (score / max score x 100). Preparation data only; not an employability measure.",
    }
