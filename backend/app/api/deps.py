"""Authentication and authorisation dependencies. Roles are always read from the database."""
import hmac
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User
from app.models.entities import DepartmentStaffAssignment
from app.models.enums import Role

ACCESS_COOKIE = "access_token"
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Roles that represent institutional staff (above student level).
STAFF_ROLES = {Role.admin, Role.faculty, Role.coordinator}


def user_from_request(request: Request, db: Session) -> User | None:
    """Resolve the user from the session cookie, or None if missing/invalid/expired."""
    token = request.cookies.get(ACCESS_COOKIE)
    payload = decode_access_token(token) if token else None
    if not payload:
        return None
    try:
        user = db.get(User, uuid.UUID(payload["sub"]))
    except ValueError:
        return None
    if user is None or payload.get("tv") != user.token_version:
        return None
    return user


def get_current_user(request: Request, db: Annotated[Session, Depends(get_db)]) -> User:
    user = user_from_request(request, db)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated or session expired")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated")
    if request.method not in SAFE_METHODS:  # double-submit CSRF check for cookie sessions
        sent, cookie = request.headers.get(CSRF_HEADER), request.cookies.get(CSRF_COOKIE)
        if not sent or not cookie or not hmac.compare_digest(sent, cookie):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF validation failed")
    return user


def require_student(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != Role.student:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Student access required")
    return user


def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != Role.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator access required")
    return user


def require_staff(user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require any institutional staff role (faculty, coordinator, or admin)."""
    if user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff access required")
    return user


def require_coordinator(user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require coordinator or admin role."""
    if user.role not in {Role.admin, Role.coordinator}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Coordinator or administrator access required")
    return user


def require_faculty(user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require any staff role that can mentor students."""
    if user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Faculty access required")
    return user


def check_dept_access(user: User, department_id: uuid.UUID, db: Session) -> None:
    """Raise 403 if user is not admin and not assigned to department_id."""
    if user.role == Role.admin:
        return  # admins have institution-wide access
    assignment = db.scalar(
        select(DepartmentStaffAssignment).where(
            DepartmentStaffAssignment.user_id == user.id,
            DepartmentStaffAssignment.department_id == department_id,
            DepartmentStaffAssignment.is_active.is_(True),
        )
    )
    if assignment is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not assigned to this department")


DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
def get_optional_user(request: Request, db: Annotated[Session, Depends(get_db)]) -> User | None:
    return user_from_request(request, db)

OptionalUser = Annotated[User | None, Depends(get_optional_user)]
Student = Annotated[User, Depends(require_student)]
Admin = Annotated[User, Depends(require_admin)]
Staff = Annotated[User, Depends(require_staff)]
Coordinator = Annotated[User, Depends(require_coordinator)]
Faculty = Annotated[User, Depends(require_faculty)]

