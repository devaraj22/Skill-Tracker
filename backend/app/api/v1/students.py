from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, Student
from app.models import StudentProfile, User
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.services.activity import log_activity
from app.services.dashboard import profile_completion

router = APIRouter(prefix="/students", tags=["students"])

NON_NULLABLE = {"full_name", "portfolio_public", "portfolio_sections"}


def profile_out(user: User) -> ProfileOut:
    p = user.profile
    data = {c.name: getattr(p, c.name) for c in StudentProfile.__table__.columns}
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
