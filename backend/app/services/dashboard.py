from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ActivityLog, Certification, LearningGoal, Project, Skill, StudentProfile, User
from app.models.enums import CertStatus, GoalStatus
from app.services.goals import is_overdue
from app.services.placement import placement_summary

COMPLETION_FIELDS = [
    "full_name", "register_number", "department", "year_of_study", "avatar_url", "bio",
    "github_url", "linkedin_url", "resume_url", "portfolio_username",
]


def profile_completion(p: StudentProfile | None) -> int:
    """Percent of the 10 COMPLETION_FIELDS that are filled in."""
    if p is None:
        return 0
    filled = sum(1 for f in COMPLETION_FIELDS if getattr(p, f) not in (None, ""))
    return round(filled / len(COMPLETION_FIELDS) * 100)


def _count(db: Session, model, *where) -> int:
    return db.scalar(select(func.count()).select_from(model).where(*where)) or 0


def student_dashboard(db: Session, user: User) -> dict:
    uid, today = user.id, date.today()
    profile = user.profile
    goals = db.scalars(select(LearningGoal).where(LearningGoal.user_id == uid)).all()
    open_goals = [g for g in goals if g.status != GoalStatus.completed]
    dated = sorted((g for g in open_goals if g.target_date), key=lambda g: g.target_date)

    def brief(g):
        return {"id": str(g.id), "title": g.title, "target_date": g.target_date.isoformat(),
                "progress": g.progress, "is_overdue": is_overdue(g.target_date, g.status)}

    dist = db.execute(select(Skill.category, func.count()).where(Skill.user_id == uid).group_by(Skill.category)).all()
    recent = db.scalars(
        select(ActivityLog).where(ActivityLog.subject_user_id == uid).order_by(ActivityLog.created_at.desc()).limit(8)
    ).all()
    return {
        "full_name": profile.full_name if profile else user.email,
        "profile_completion": profile_completion(profile),
        "skills_count": _count(db, Skill, Skill.user_id == uid),
        "projects_count": _count(db, Project, Project.user_id == uid),
        "certificates_submitted": _count(db, Certification, Certification.user_id == uid),
        "certificates_verified": _count(db, Certification, Certification.user_id == uid, Certification.status == CertStatus.verified),
        "goals": {
            "total": len(goals),
            "completed": sum(1 for g in goals if g.status == GoalStatus.completed),
            "in_progress": sum(1 for g in goals if g.status == GoalStatus.in_progress),
            "not_started": sum(1 for g in goals if g.status == GoalStatus.not_started),
            "overdue": sum(1 for g in open_goals if is_overdue(g.target_date, g.status)),
            "average_progress": round(sum(g.progress for g in goals) / len(goals)) if goals else None,
        },
        "upcoming_deadlines": [brief(g) for g in dated if g.target_date >= today][:5],
        "overdue_goals": [brief(g) for g in dated if g.target_date < today][:5],
        "skill_distribution": [{"category": c.value, "count": n} for c, n in dist],
        "placement": placement_summary(db, uid, profile),
        "recent_activity": [
            {"action": a.action, "entity_type": a.entity_type, "summary": a.summary, "created_at": a.created_at.isoformat()}
            for a in recent
        ],
    }
