from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DB
from app.api.v1 import achievements, admin, auth, certifications, dashboard, goals, placement, portfolio, projects, reports, skills, students

api_router = APIRouter()
for module in (auth, students, skills, certifications, projects, achievements, goals, placement, portfolio, dashboard, admin, reports):
    api_router.include_router(module.router)


@api_router.get("/health", tags=["health"])
def health(db: DB) -> dict:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
