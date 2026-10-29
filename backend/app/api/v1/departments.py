"""Department CRUD and analytics router."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import Admin, CurrentUser, DB, OptionalUser, check_dept_access
from app.models import Department, DepartmentStaffAssignment, StudentProfile, User
from app.models.enums import Role
from app.repositories.common import PageParams, paginate
from app.schemas.common import Page
from app.schemas.department import (
    DepartmentCreate, DepartmentOut, DepartmentUpdate,
    StaffAssignmentCreate, StaffAssignmentOut, StaffAssignmentUpdate,
)
from app.services.activity import log_activity

router = APIRouter(prefix="/departments", tags=["departments"])
staff_router = APIRouter(prefix="/staff", tags=["staff-assignments"])

DEPT_SORTS = {
    "name": Department.name,
    "code": Department.code,
    "created_at": Department.created_at,
}


def _dept_out(d: Department) -> DepartmentOut:
    return DepartmentOut.model_validate(d)


def _get_dept_or_404(db: Session, dept_id: uuid.UUID) -> Department:
    dept = db.get(Department, dept_id)
    if dept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
    return dept


# ── Department CRUD ───────────────────────────────────────────────────────────

@router.get("", response_model=list[DepartmentOut])
def list_departments(
    db: DB,
    user: OptionalUser = None,
    active_only: bool = Query(True),
    group: str | None = Query(None, max_length=10),
) -> list[DepartmentOut]:
    """List departments. Public visitors and students see active ones; admins can view all."""
    stmt = select(Department)
    if user is None or user.role != Role.admin:
        active_only = True
    if active_only:
        stmt = stmt.where(Department.is_active.is_(True))
    if group:
        stmt = stmt.where(Department.school_group == group)
    depts = db.scalars(stmt.order_by(Department.code)).all()
    return [_dept_out(d) for d in depts]


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(body: DepartmentCreate, admin: Admin, db: DB) -> DepartmentOut:
    if db.scalar(select(Department.id).where(Department.code == body.code)):
        raise HTTPException(status.HTTP_409_CONFLICT, "A department with this code already exists")
    dept = Department(**body.model_dump())
    db.add(dept)
    log_activity(db, actor_id=admin.id, subject_user_id=None, admin=True,
                 action="department.created", entity_type="department",
                 entity_id=str(dept.id), summary=dept.name)
    db.commit()
    db.refresh(dept)
    return _dept_out(dept)


@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: uuid.UUID, _: CurrentUser, db: DB) -> DepartmentOut:
    return _dept_out(_get_dept_or_404(db, dept_id))


@router.patch("/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: uuid.UUID, body: DepartmentUpdate, admin: Admin, db: DB) -> DepartmentOut:
    dept = _get_dept_or_404(db, dept_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(dept, k, v)
    log_activity(db, actor_id=admin.id, subject_user_id=None, admin=True,
                 action="department.updated", entity_type="department",
                 entity_id=str(dept.id), summary=dept.name)
    db.commit()
    db.refresh(dept)
    return _dept_out(dept)


@router.get("/{dept_id}/analytics")
def department_analytics(
    dept_id: uuid.UUID,
    user: CurrentUser,
    db: DB,
) -> dict:
    """Department-level aggregates. Accessible to admin or assigned staff."""
    check_dept_access(user, dept_id, db)
    dept = _get_dept_or_404(db, dept_id)

    total_students = db.scalar(
        select(func.count(StudentProfile.id))
        .join(User, User.id == StudentProfile.user_id)
        .where(StudentProfile.department_id == dept_id, User.role == Role.student)
    ) or 0

    active_students = db.scalar(
        select(func.count(StudentProfile.id))
        .join(User, User.id == StudentProfile.user_id)
        .where(StudentProfile.department_id == dept_id,
               User.role == Role.student,
               User.is_active.is_(True))
    ) or 0

    by_year = db.execute(
        select(StudentProfile.year_of_study, func.count())
        .join(User, User.id == StudentProfile.user_id)
        .where(StudentProfile.department_id == dept_id, User.role == Role.student)
        .group_by(StudentProfile.year_of_study)
        .order_by(StudentProfile.year_of_study)
    ).all()

    return {
        "department": {"id": str(dept.id), "code": dept.code, "name": dept.name,
                       "school_group": dept.school_group.value},
        "students": {"total": total_students, "active": active_students,
                     "inactive": total_students - active_students},
        "by_year": [{"year": y, "count": n} for y, n in by_year],
    }


# ── Staff assignments (nested under /staff for clarity) ──────────────────────

@staff_router.get("/assignments", response_model=Page[StaffAssignmentOut])
def list_staff_assignments(
    _: Admin,
    db: DB,
    params: Annotated[PageParams, Depends()],
    department_id: uuid.UUID | None = Query(None),
) -> Page[StaffAssignmentOut]:
    stmt = select(DepartmentStaffAssignment)
    if department_id:
        stmt = stmt.where(DepartmentStaffAssignment.department_id == department_id)
    rows, total = paginate(db, stmt.order_by(DepartmentStaffAssignment.created_at.desc()), params)
    items = []
    for r in rows:
        profile = r.user.profile if r.user else None
        out = StaffAssignmentOut.model_validate({
            **r.__dict__,
            "user_email": r.user.email if r.user else None,
            "user_name": profile.full_name if profile else None,
            "department_name": r.department.name if r.department else None,
        })
        items.append(out)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@staff_router.post("/assignments", response_model=StaffAssignmentOut, status_code=status.HTTP_201_CREATED)
def create_staff_assignment(body: StaffAssignmentCreate, admin: Admin, db: DB) -> StaffAssignmentOut:
    # Validate referenced user and department exist
    target_user = db.get(User, body.user_id)
    if target_user is None or target_user.role not in {Role.faculty, Role.coordinator}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            "User must exist and have role faculty or coordinator")
    if not db.get(Department, body.department_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")

    assignment = DepartmentStaffAssignment(
        user_id=body.user_id,
        department_id=body.department_id,
        assignment_role=body.assignment_role,
        is_active=True,
    )
    db.add(assignment)
    log_activity(db, actor_id=admin.id, subject_user_id=body.user_id, admin=True,
                 action="staff.assigned", entity_type="department_staff_assignment",
                 entity_id=str(assignment.id), summary=f"role={body.assignment_role}")
    db.commit()
    db.refresh(assignment)
    profile = assignment.user.profile if assignment.user else None
    return StaffAssignmentOut.model_validate({
        **assignment.__dict__,
        "user_email": assignment.user.email if assignment.user else None,
        "user_name": profile.full_name if profile else None,
        "department_name": assignment.department.name if assignment.department else None,
    })


@staff_router.patch("/assignments/{assignment_id}", response_model=StaffAssignmentOut)
def update_staff_assignment(
    assignment_id: uuid.UUID,
    body: StaffAssignmentUpdate,
    admin: Admin,
    db: DB,
) -> StaffAssignmentOut:
    asgn = db.get(DepartmentStaffAssignment, assignment_id)
    if asgn is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found")
    asgn.is_active = body.is_active
    log_activity(db, actor_id=admin.id, subject_user_id=asgn.user_id, admin=True,
                 action="staff.assignment_updated", entity_type="department_staff_assignment",
                 entity_id=str(asgn.id), summary=f"is_active={body.is_active}")
    db.commit()
    db.refresh(asgn)
    profile = asgn.user.profile if asgn.user else None
    return StaffAssignmentOut.model_validate({
        **asgn.__dict__,
        "user_email": asgn.user.email if asgn.user else None,
        "user_name": profile.full_name if profile else None,
        "department_name": asgn.department.name if asgn.department else None,
    })
