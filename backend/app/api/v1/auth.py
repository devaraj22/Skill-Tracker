from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select

from app.api.deps import ACCESS_COOKIE, CSRF_COOKIE, CurrentUser, DB, user_from_request
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, new_csrf_token, verify_password
from app.models import StudentProfile, User
from app.models.enums import Role
from app.schemas.auth import LoginIn, RegisterIn, UserOut
from app.services.activity import log_activity

router = APIRouter(prefix="/auth", tags=["auth"])


def user_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    out.full_name = user.profile.full_name if user.profile else None
    return out


def _set_cookies(response: Response, user: User) -> None:
    s = get_settings()
    common = dict(max_age=s.access_token_minutes * 60, secure=s.is_production, samesite=s.cookie_samesite, path="/")
    response.set_cookie(ACCESS_COOKIE, create_access_token(user.id, user.token_version), httponly=True, **common)
    # Readable by the frontend so it can echo it in the X-CSRF-Token header (double-submit pattern).
    response.set_cookie(CSRF_COOKIE, new_csrf_token(), httponly=False, **common)


def _clear_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn, response: Response, db: DB):
    """Public student registration. The role is always `student`; it cannot be supplied by the client."""
    if db.scalar(select(User.id).where(User.email == body.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    if body.register_number and db.scalar(select(StudentProfile.id).where(StudentProfile.register_number == body.register_number)):
        raise HTTPException(status.HTTP_409_CONFLICT, "This register number is already registered")
    user = User(email=body.email, password_hash=hash_password(body.password), role=Role.student)
    user.profile = StudentProfile(
        full_name=body.full_name, register_number=body.register_number,
        department=body.department, year_of_study=body.year_of_study,
    )
    db.add(user)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="account.registered", entity_type="user", entity_id=user.id, summary="Joined SkillTrack")
    db.commit()
    _set_cookies(response, user)
    return user_out(user)


@router.post("/login", response_model=UserOut)
def login(body: LoginIn, response: Response, db: DB):
    user = db.scalar(select(User).where(User.email == body.email))
    password_ok = verify_password(body.password, user.password_hash if user else None)
    if not user or not password_ok:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated. Contact your college administrator.")
    _set_cookies(response, user)
    return user_out(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: DB):
    """Clears cookies and revokes this user's existing tokens by bumping token_version."""
    user = user_from_request(request, db)
    if user:
        user.token_version += 1
        db.commit()
    _clear_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user_out(user)
