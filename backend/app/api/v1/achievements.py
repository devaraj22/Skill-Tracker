import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import or_, select

from app.api.deps import DB, Student
from app.models import Achievement
from app.models.enums import AchievementType
from app.repositories.common import PageParams, apply_update, get_owned_or_404, like_pattern, ordering, paginate
from app.schemas.achievement import AchievementCreate, AchievementOut, AchievementUpdate
from app.schemas.common import Page
from app.services.activity import log_activity

router = APIRouter(prefix="/achievements", tags=["achievements"])
SORTS = {"achieved_on": Achievement.achieved_on, "title": Achievement.title, "created_at": Achievement.created_at}


@router.get("", response_model=Page[AchievementOut])
def list_achievements(
    user: Student, db: DB, params: Annotated[PageParams, Depends()],
    q: str | None = Query(None, max_length=80), kind: AchievementType | None = None, is_public: bool | None = None,
    sort: str = "achieved_on", order: Literal["asc", "desc"] = "desc",
):
    stmt = select(Achievement).where(Achievement.user_id == user.id)
    if q:
        stmt = stmt.where(or_(Achievement.title.ilike(like_pattern(q), escape="\\"), Achievement.organization.ilike(like_pattern(q), escape="\\")))
    if kind:
        stmt = stmt.where(Achievement.kind == kind)
    if is_public is not None:
        stmt = stmt.where(Achievement.is_public.is_(is_public))
    items, total = paginate(db, stmt.order_by(ordering(SORTS, sort, order), Achievement.id), params)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.post("", response_model=AchievementOut, status_code=status.HTTP_201_CREATED)
def create_achievement(body: AchievementCreate, user: Student, db: DB):
    item = Achievement(user_id=user.id, **body.model_dump())
    db.add(item)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="achievement.created", entity_type="achievement", entity_id=item.id, summary=item.title)
    db.commit()
    return item


@router.patch("/{item_id}", response_model=AchievementOut)
def update_achievement(item_id: uuid.UUID, body: AchievementUpdate, user: Student, db: DB):
    item = get_owned_or_404(db, Achievement, item_id, user.id, "Achievement")
    apply_update(item, body.model_dump(exclude_unset=True), {"title", "kind", "organization", "achieved_on", "is_public"})
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="achievement.updated", entity_type="achievement", entity_id=item.id, summary=item.title)
    db.commit()
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_achievement(item_id: uuid.UUID, user: Student, db: DB):
    item = get_owned_or_404(db, Achievement, item_id, user.id, "Achievement")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="achievement.deleted", entity_type="achievement", entity_id=item.id, summary=item.title)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
