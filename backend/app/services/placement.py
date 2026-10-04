"""Placement-readiness summary. This is a preparation tracker, not a prediction.

Formula (documented in docs/API.md):
  percent(assessment) = score / max_score * 100
  category value      = percent of the most recent assessment in that category (by assessed_on, then created_at)
  overall average     = mean of category values, over ONLY the categories that have at least one assessment
Categories without data are listed as missing and are not counted as zero.
"""
from collections import defaultdict
from statistics import mean

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import PlacementAssessment, Project, StudentProfile
from app.models.enums import PlacementCategory

LABELS = {
    PlacementCategory.coding_dsa: "Coding and DSA",
    PlacementCategory.aptitude: "Aptitude",
    PlacementCategory.technical: "Technical knowledge",
    PlacementCategory.communication: "Communication",
    PlacementCategory.mock_interview: "Mock interviews",
    PlacementCategory.resume_portfolio: "Resume and portfolio preparation",
}


def pct(a: PlacementAssessment) -> float:
    return round(a.score / a.max_score * 100, 1)


def placement_summary(db: Session, user_id, profile: StudentProfile | None) -> dict:
    rows = db.scalars(
        select(PlacementAssessment).where(PlacementAssessment.user_id == user_id)
        .order_by(PlacementAssessment.assessed_on.desc(), PlacementAssessment.created_at.desc())
    ).all()
    latest, counts, history = {}, defaultdict(int), defaultdict(list)
    for a in rows:  # newest first
        latest.setdefault(a.category, a)
        counts[a.category] += 1
        history[a.category].append({"date": a.assessed_on.isoformat(), "percent": pct(a), "title": a.title})

    categories = []
    for cat in PlacementCategory:
        a = latest.get(cat)
        categories.append({
            "category": cat.value, "label": LABELS[cat], "has_data": a is not None,
            "latest_percent": pct(a) if a else None, "latest_title": a.title if a else None,
            "latest_date": a.assessed_on.isoformat() if a else None, "assessment_count": counts[cat],
        })
    values = [c["latest_percent"] for c in categories if c["has_data"]]
    missing = [c["category"] for c in categories if not c["has_data"]]

    steps: list[str] = []
    for c in categories:
        label, p = c["label"], c["latest_percent"]
        if not c["has_data"]:
            steps.append(f"Record your first {label} assessment.")
        elif p < 50:
            steps.append(f"{label}: your latest result is {p}%. Schedule focused practice, then record another assessment.")
        elif p < 75:
            steps.append(f"{label}: your latest result is {p}%. Keep practising to improve it.")

    project_total = db.scalar(select(func.count()).select_from(Project).where(Project.user_id == user_id)) or 0
    project_public = db.scalar(select(func.count()).select_from(Project).where(Project.user_id == user_id, Project.is_public.is_(True))) or 0
    pr = profile
    checklist = [
        {"key": "resume", "label": "Add your resume link", "done": bool(pr and pr.resume_url)},
        {"key": "github", "label": "Add your GitHub profile", "done": bool(pr and pr.github_url)},
        {"key": "linkedin", "label": "Add your LinkedIn profile", "done": bool(pr and pr.linkedin_url)},
        {"key": "bio", "label": "Write a short biography", "done": bool(pr and pr.bio)},
        {"key": "project", "label": "Add at least one project", "done": project_total > 0},
        {"key": "public_project", "label": "Publish at least one project", "done": project_public > 0},
        {"key": "portfolio", "label": "Publish your portfolio", "done": bool(pr and pr.portfolio_public and pr.portfolio_username)},
    ]
    for item in checklist:
        if not item["done"]:
            steps.append(item["label"] + ".")
    if not steps:
        steps.append("All recorded areas are at 75% or above. Keep assessments regular.")

    return {
        "categories": categories,
        "overall_percent": round(mean(values), 1) if values else None,
        "categories_with_data": len(values),
        "categories_total": len(PlacementCategory),
        "missing_categories": missing,
        "formula": "Average of the latest normalised score (score / max score x 100) in each category that has data. Categories without data are excluded, not counted as zero. This is a preparation indicator, not a prediction of placement outcomes.",
        "history": {cat.value: list(reversed(history[cat][:12])) for cat in PlacementCategory if history[cat]},
        "checklist": checklist,
        "next_steps": steps[:8],
    }
