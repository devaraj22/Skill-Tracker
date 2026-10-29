"""Skill assessments router.

Students can submit self-assessments.
Faculty/coordinators can submit assessments for assigned students.
"""
import uuid

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser, Student
from app.models import SkillAssessment, StudentProfile, User
from app.models.entities import DepartmentStaffAssignment
from app.models.enums import Role
from app.repositories.common import PageParams, paginate
from app.schemas.common import Page
from app.schemas.skill_assessment import SkillAssessmentCreate, SkillAssessmentOut

router = APIRouter(prefix="/skill-assessments", tags=["skill-assessments"])


def _can_access_student(actor: User, student_id: uuid.UUID, db) -> bool:
    """Return True if the actor is admin, the student themselves, or an assigned faculty."""
    if actor.role == Role.admin:
        return True
    if actor.id == student_id:
        return True
    if actor.role in {Role.faculty, Role.coordinator}:
        # Check if student shares any of the actor's assigned departments
        student_profile = db.scalar(
            select(StudentProfile).where(StudentProfile.user_id == student_id)
        )
        if student_profile and student_profile.department_id:
            assignment = db.scalar(
                select(DepartmentStaffAssignment).where(
                    DepartmentStaffAssignment.user_id == actor.id,
                    DepartmentStaffAssignment.department_id == student_profile.department_id,
                    DepartmentStaffAssignment.is_active.is_(True),
                )
            )
            return assignment is not None
    return False


@router.get("/me", response_model=Page[SkillAssessmentOut])
def my_assessments(user: Student, db: DB, params: Annotated[PageParams, Depends()]) -> Page[SkillAssessmentOut]:
    """Return the calling student's own skill assessments."""
    stmt = select(SkillAssessment).where(
        SkillAssessment.user_id == user.id
    ).order_by(SkillAssessment.assessed_at.desc())
    rows, total = paginate(db, stmt, params)
    return Page(
        items=[SkillAssessmentOut.model_validate({**r.__dict__, "percent": r.percent}) for r in rows],
        total=total, page=params.page, page_size=params.page_size,
    )


@router.get("/students/{student_id}", response_model=Page[SkillAssessmentOut])
def student_assessments(
    student_id: uuid.UUID,
    user: CurrentUser,
    db: DB,
    params: Annotated[PageParams, Depends()],
) -> Page[SkillAssessmentOut]:
    """Return assessments for a specific student. Requires relevant access."""
    if not _can_access_student(user, student_id, db):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot access this student's assessments")
    stmt = select(SkillAssessment).where(
        SkillAssessment.user_id == student_id
    ).order_by(SkillAssessment.assessed_at.desc())
    rows, total = paginate(db, stmt, params)
    return Page(
        items=[SkillAssessmentOut.model_validate({**r.__dict__, "percent": r.percent}) for r in rows],
        total=total, page=params.page, page_size=params.page_size,
    )


@router.post("", response_model=SkillAssessmentOut, status_code=status.HTTP_201_CREATED)
def create_assessment(body: SkillAssessmentCreate, user: CurrentUser, db: DB) -> SkillAssessmentOut:
    """
    Submit a skill assessment.
    - Students omit student_id (applied to self).
    - Faculty/coordinators supply student_id for the target student.
    - Admins can supply any student_id.
    """
    if body.student_id and body.student_id != user.id:
        # Staff submitting for a student
        if not _can_access_student(user, body.student_id, db):
            raise HTTPException(status.HTTP_403_FORBIDDEN,
                                "You are not authorised to assess this student")
        target_user_id = body.student_id
        assessed_by_id = user.id
    else:
        # Self-assessment
        if user.role not in {Role.student, Role.admin}:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Only students may self-assess")
        target_user_id = user.id
        assessed_by_id = None

    assessment = SkillAssessment(
        user_id=target_user_id,
        skill_name=body.skill_name,
        category=body.category,
        score=body.score,
        max_score=body.max_score,
        assessed_by_id=assessed_by_id,
        feedback=body.feedback,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return SkillAssessmentOut.model_validate({**assessment.__dict__, "percent": assessment.percent})
