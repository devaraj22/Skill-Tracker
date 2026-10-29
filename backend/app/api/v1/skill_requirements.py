"""Department skill requirements router."""
import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import Admin, CurrentUser, DB, check_dept_access
from app.models import Department, DepartmentSkillRequirement
from app.models.enums import Role
from app.schemas.skill_requirement import SkillRequirementCreate, SkillRequirementOut, SkillRequirementUpdate

router = APIRouter(prefix="/departments/{dept_id}/requirements", tags=["skill-requirements"])


def _get_dept_or_404(db, dept_id: uuid.UUID) -> Department:
    dept = db.get(Department, dept_id)
    if dept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
    return dept


def _get_req_or_404(db, req_id: uuid.UUID, dept_id: uuid.UUID) -> DepartmentSkillRequirement:
    req = db.get(DepartmentSkillRequirement, req_id)
    if req is None or req.department_id != dept_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill requirement not found")
    return req


@router.get("", response_model=list[SkillRequirementOut])
def list_requirements(
    dept_id: uuid.UUID,
    user: CurrentUser,
    db: DB,
    study_year: int | None = None,
) -> list[SkillRequirementOut]:
    """List skill requirements for a department. Accessible to any authenticated user."""
    _get_dept_or_404(db, dept_id)
    stmt = select(DepartmentSkillRequirement).where(
        DepartmentSkillRequirement.department_id == dept_id
    )
    if study_year is not None:
        stmt = stmt.where(
            (DepartmentSkillRequirement.study_year == study_year) |
            DepartmentSkillRequirement.study_year.is_(None)
        )
    reqs = db.scalars(stmt.order_by(
        DepartmentSkillRequirement.is_required.desc(),
        DepartmentSkillRequirement.weight.desc(),
        DepartmentSkillRequirement.skill_name,
    )).all()
    return [SkillRequirementOut.model_validate(r) for r in reqs]


@router.post("", response_model=SkillRequirementOut, status_code=status.HTTP_201_CREATED)
def create_requirement(
    dept_id: uuid.UUID,
    body: SkillRequirementCreate,
    user: CurrentUser,
    db: DB,
) -> SkillRequirementOut:
    """Add a skill requirement. Requires admin or coordinator assigned to this department."""
    if user.role not in {Role.admin, Role.coordinator}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Coordinator or admin access required")
    check_dept_access(user, dept_id, db)
    _get_dept_or_404(db, dept_id)
    req = DepartmentSkillRequirement(department_id=dept_id, **body.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    return SkillRequirementOut.model_validate(req)


@router.patch("/{req_id}", response_model=SkillRequirementOut)
def update_requirement(
    dept_id: uuid.UUID,
    req_id: uuid.UUID,
    body: SkillRequirementUpdate,
    user: CurrentUser,
    db: DB,
) -> SkillRequirementOut:
    if user.role not in {Role.admin, Role.coordinator}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Coordinator or admin access required")
    check_dept_access(user, dept_id, db)
    req = _get_req_or_404(db, req_id, dept_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(req, k, v)
    db.commit()
    db.refresh(req)
    return SkillRequirementOut.model_validate(req)


@router.delete("/{req_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requirement(dept_id: uuid.UUID, req_id: uuid.UUID, _: Admin, db: DB) -> None:
    req = _get_req_or_404(db, req_id, dept_id)
    db.delete(req)
    db.commit()
