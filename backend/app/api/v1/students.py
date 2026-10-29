from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, Student
from app.models import Department, StudentProfile, User
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.services.activity import log_activity
from app.services.dashboard import profile_completion
from app.services.skill_gap import compute_skill_gaps

router = APIRouter(prefix="/students", tags=["students"])

NON_NULLABLE = {"full_name", "portfolio_public", "portfolio_sections"}


def profile_out(user: User) -> ProfileOut:
    p = user.profile
    data = {c.name: getattr(p, c.name) for c in StudentProfile.__table__.columns}
    dept_name = p.dept.name if p.dept else p.department
    dept_code = p.dept.code if p.dept else None
    data["department"] = dept_name
    data["department_id"] = p.department_id
    data["department_code"] = dept_code
    return ProfileOut(**data, email=user.email, completion_percent=profile_completion(p))


@router.get("/me", response_model=ProfileOut)
def get_my_profile(user: Student):
    return profile_out(user)


@router.patch("/me", response_model=ProfileOut)
def update_my_profile(body: ProfileUpdate, user: Student, db: DB):
    p, data = user.profile, body.model_dump(exclude_unset=True)
    for key in NON_NULLABLE & data.keys():
        if data[key] is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"{key} cannot be empty")
    if "register_number" in data:
        new = data["register_number"]
        if p.register_number and new != p.register_number:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Only an administrator can change a register number")
        if new and db.scalar(select(StudentProfile.id).where(StudentProfile.register_number == new, StudentProfile.id != p.id)):
            raise HTTPException(status.HTTP_409_CONFLICT, "This register number is already registered")
    if data.get("portfolio_username") and db.scalar(
        select(StudentProfile.id).where(StudentProfile.portfolio_username == data["portfolio_username"], StudentProfile.id != p.id)
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "This portfolio username is already taken")
    if "department_id" in data:
        dept_id = data.pop("department_id")
        if dept_id is not None:
            dept = db.get(Department, dept_id)
            if dept is None or not dept.is_active:
                raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Selected department does not exist or is inactive")
            p.department_id = dept.id
            p.department = dept.name
        else:
            p.department_id = None
    if "portfolio_sections" in data:
        data["portfolio_sections"] = list(dict.fromkeys(data["portfolio_sections"]))
    for k, v in data.items():
        setattr(p, k, v)
    if p.portfolio_public and not p.portfolio_username:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Choose a portfolio username before publishing")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="profile.updated", entity_type="profile", entity_id=p.id, summary="Updated profile")
    db.commit()
    db.refresh(user)
    return profile_out(user)


@router.get("/me/skill-gaps")
def my_skill_gaps(user: Student, db: DB) -> dict:
    """
    Return the calling student's skill-gap report based on their department's
    requirements.  If the student is not yet assigned to a department, a
    descriptive message is returned rather than an error.
    """
    return compute_skill_gaps(db, user.id)
