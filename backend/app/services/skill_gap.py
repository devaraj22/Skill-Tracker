"""
Skill-gap analysis service.

Algorithm (transparent, rules-based):
1. Load the department skill requirements for the student's department and year.
2. Load the student's assessed skill scores (SkillAssessment) and self-reported
   skills (Skill) for each required skill.
3. Compare achieved evidence level against the target level.
4. Sort gaps by (is_required DESC, weight DESC, gap_size DESC).
5. Recommend learning-goal actions for the top-priority gaps.

Assessment evidence is preferred over self-reporting.  If neither is present the
skill is marked "not_assessed" — it is NOT assumed that the student lacks the skill.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DepartmentSkillRequirement, Skill, SkillAssessment, StudentProfile
from app.models.enums import SkillLevel

# Numeric mapping used only for gap-size calculation; never stored.
_LEVEL_SCORE = {
    SkillLevel.beginner: 1,
    SkillLevel.intermediate: 2,
    SkillLevel.advanced: 3,
    SkillLevel.expert: 4,
}


def _assessed_level(percent: float) -> SkillLevel:
    """Convert an assessment percentage to the closest skill level."""
    if percent >= 87.5:
        return SkillLevel.expert
    if percent >= 62.5:
        return SkillLevel.advanced
    if percent >= 37.5:
        return SkillLevel.intermediate
    return SkillLevel.beginner


def compute_skill_gaps(db: Session, user_id: uuid.UUID) -> dict:
    """
    Return a skill-gap report for the student identified by user_id.

    Returns a dict with:
      - department_id, department_name
      - study_year
      - gaps: list of gap items, sorted by priority
      - summary: counts by status
    """
    profile: StudentProfile | None = db.scalar(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    )
    if profile is None or profile.department_id is None:
        return {
            "department_id": None,
            "department_name": None,
            "study_year": profile.year_of_study if profile else None,
            "gaps": [],
            "summary": {"met": 0, "partial": 0, "not_assessed": 0, "gap": 0},
            "note": "Assign the student to a department to see skill requirements.",
        }

    dept_id = profile.department_id
    year = profile.year_of_study

    # Load requirements applicable to this year (or global requirements)
    req_stmt = select(DepartmentSkillRequirement).where(
        DepartmentSkillRequirement.department_id == dept_id,
    )
    if year is not None:
        req_stmt = req_stmt.where(
            (DepartmentSkillRequirement.study_year == year) |
            DepartmentSkillRequirement.study_year.is_(None)
        )
    requirements = db.scalars(req_stmt).all()

    if not requirements:
        return {
            "department_id": str(dept_id),
            "department_name": profile.dept.name if profile.dept else None,
            "study_year": year,
            "gaps": [],
            "summary": {"met": 0, "partial": 0, "not_assessed": 0, "gap": 0},
            "note": "No skill requirements have been configured for this department yet.",
        }

    # Load student's most recent assessment per skill
    all_assessments = db.scalars(
        select(SkillAssessment).where(SkillAssessment.user_id == user_id)
    ).all()
    latest_assessment: dict[str, SkillAssessment] = {}
    for a in all_assessments:
        key = a.skill_name.lower()
        if key not in latest_assessment or a.assessed_at > latest_assessment[key].assessed_at:
            latest_assessment[key] = a

    # Load student's self-reported skills
    self_skills: dict[str, Skill] = {
        s.name.lower(): s
        for s in db.scalars(select(Skill).where(Skill.user_id == user_id)).all()
    }

    gaps = []
    summary = {"met": 0, "partial": 0, "not_assessed": 0, "gap": 0}

    for req in requirements:
        skill_key = req.skill_name.lower()
        target_score = _LEVEL_SCORE[req.target_level]

        # Prefer assessed evidence; fall back to self-report
        if skill_key in latest_assessment:
            asmt = latest_assessment[skill_key]
            achieved_level = _assessed_level(asmt.percent)
            achieved_score = _LEVEL_SCORE[achieved_level]
            evidence_type = "assessed"
            evidence_detail = f"{asmt.percent:.0f}% on {asmt.assessed_at.date()}"
        elif skill_key in self_skills:
            sk = self_skills[skill_key]
            achieved_level = sk.level
            achieved_score = _LEVEL_SCORE[achieved_level]
            evidence_type = "self_reported"
            evidence_detail = f"Self-reported as {sk.level.value}"
        else:
            achieved_level = None
            achieved_score = 0
            evidence_type = "not_assessed"
            evidence_detail = None

        gap_size = max(0, target_score - achieved_score)

        if evidence_type == "not_assessed":
            status_label = "not_assessed"
            summary["not_assessed"] += 1
        elif gap_size == 0:
            status_label = "met"
            summary["met"] += 1
        elif gap_size == 1:
            status_label = "partial"
            summary["partial"] += 1
        else:
            status_label = "gap"
            summary["gap"] += 1

        gaps.append({
            "skill_name": req.skill_name,
            "category": req.category.value,
            "target_level": req.target_level.value,
            "achieved_level": achieved_level.value if achieved_level else None,
            "evidence_type": evidence_type,
            "evidence_detail": evidence_detail,
            "gap_size": gap_size,
            "status": status_label,
            "is_required": req.is_required,
            "weight": req.weight,
            # Recommendations are shown only when there is a gap or no data.
            "recommended_action": _recommend(req, status_label),
        })

    # Sort: required first, then weight descending, then gap size descending
    gaps.sort(key=lambda g: (
        not g["is_required"],
        -g["weight"],
        -(g["gap_size"] if g["gap_size"] > 0 else (4 if g["status"] == "not_assessed" else 0)),
    ))

    return {
        "department_id": str(dept_id),
        "department_name": profile.dept.name if profile.dept else None,
        "study_year": year,
        "gaps": gaps,
        "summary": summary,
        "note": (
            "Assessed scores are preferred over self-reported levels. "
            "Skills marked 'not_assessed' are opportunities, not failures."
        ),
    }


def _recommend(req: DepartmentSkillRequirement, status_label: str) -> str | None:
    if status_label == "met":
        return None
    verb = "begin learning" if status_label == "not_assessed" else "improve your"
    return (
        f"Set a learning goal to {verb} {req.skill_name} "
        f"({req.category.value}) to reach {req.target_level.value} level."
    )
