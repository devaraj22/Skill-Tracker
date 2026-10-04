import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select

from app.api.deps import DB, Student
from app.models import PlacementAssessment
from app.models.enums import PlacementCategory
from app.repositories.common import PageParams, apply_update, get_owned_or_404, ordering, paginate
from app.schemas.common import Page
from app.schemas.placement import AssessmentCreate, AssessmentOut, AssessmentUpdate
from app.services.activity import log_activity
from app.services.placement import placement_summary

router = APIRouter(prefix="/placement", tags=["placement"])
SORTS = {"assessed_on": PlacementAssessment.assessed_on, "created_at": PlacementAssessment.created_at, "category": PlacementAssessment.category}


@router.get("/assessments", response_model=Page[AssessmentOut])
def list_assessments(
    user: Student, db: DB, params: Annotated[PageParams, Depends()],
    category: PlacementCategory | None = None, sort: str = "assessed_on", order: Literal["asc", "desc"] = "desc",
):
    stmt = select(PlacementAssessment).where(PlacementAssessment.user_id == user.id)
    if category:
        stmt = stmt.where(PlacementAssessment.category == category)
    items, total = paginate(db, stmt.order_by(ordering(SORTS, sort, order), PlacementAssessment.created_at.desc()), params)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.post("/assessments", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
def create_assessment(body: AssessmentCreate, user: Student, db: DB):
    item = PlacementAssessment(user_id=user.id, **body.model_dump())
    db.add(item)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="assessment.recorded", entity_type="assessment", entity_id=item.id, summary=item.title)
    db.commit()
    return item


@router.patch("/assessments/{item_id}", response_model=AssessmentOut)
def update_assessment(item_id: uuid.UUID, body: AssessmentUpdate, user: Student, db: DB):
    item = get_owned_or_404(db, PlacementAssessment, item_id, user.id, "Assessment")
    apply_update(item, body.model_dump(exclude_unset=True), {"category", "title", "score", "max_score", "assessed_on"})
    if item.score > item.max_score:  # re-check after merging with stored values
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Score cannot exceed the maximum score")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="assessment.updated", entity_type="assessment", entity_id=item.id, summary=item.title)
    db.commit()
    return item


@router.delete("/assessments/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(item_id: uuid.UUID, user: Student, db: DB):
    item = get_owned_or_404(db, PlacementAssessment, item_id, user.id, "Assessment")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/summary")
def get_summary(user: Student, db: DB) -> dict:
    return placement_summary(db, user.id, user.profile)
