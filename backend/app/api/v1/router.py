from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DB
from app.api.v1 import (
    achievements, admin, auth, certifications, dashboard, departments,
    gamification, goals, placement, portfolio, projects, reports, roadmap,
    skill_assessments, skill_requirements, skills, students,
)

api_router = APIRouter()
for module in (
    auth, students, skills, certifications, projects, achievements,
    goals, placement, portfolio, dashboard, admin, reports,
    skill_assessments, skill_requirements, gamification, roadmap,
):
    api_router.include_router(module.router)

# Staff router is namespaced separately (prefix=/staff)
api_router.include_router(departments.router)
api_router.include_router(departments.staff_router)


@api_router.get("/health", tags=["health"])
def health(db: DB) -> dict:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
