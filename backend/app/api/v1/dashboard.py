from fastapi import APIRouter

from app.api.deps import DB, Student
from app.services.dashboard import student_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def my_dashboard(user: Student, db: DB) -> dict:
    """All values are computed from the database on every request; nothing is cached or hard-coded."""
    return student_dashboard(db, user)
