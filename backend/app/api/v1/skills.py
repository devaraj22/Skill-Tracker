import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import case, func, or_, select

from app.api.deps import DB, Student
from app.models import Skill
from app.models.enums import SkillCategory, SkillLevel
from app.repositories.common import PageParams, apply_update, get_owned_or_404, like_pattern, ordering, paginate
from app.schemas.common import Page
from app.schemas.skill import SkillCreate, SkillOut, SkillUpdate
from app.services.activity import log_activity
from typing import Annotated
from fastapi import Depends

router = APIRouter(prefix="/skills", tags=["skills"])

LEVEL_RANK = case({SkillLevel.beginner: 1, SkillLevel.intermediate: 2, SkillLevel.advanced: 3, SkillLevel.expert: 4}, value=Skill.level)
SORTS = {"name": Skill.name, "category": Skill.category, "level": LEVEL_RANK, "created_at": Skill.created_at, "updated_at": Skill.updated_at}


def _dup(db, user_id, name, exclude=None):
    q = select(Skill.id).where(Skill.user_id == user_id, func.lower(Skill.name) == name.lower())
    if exclude:
        q = q.where(Skill.id != exclude)
    if db.scalar(q):
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have a skill with this name")


@router.get("", response_model=Page[SkillOut])
def list_skills(
    user: Student, db: DB, params: Annotated[PageParams, Depends()],
    q: str | None = Query(None, max_length=80), category: SkillCategory | None = None, level: SkillLevel | None = None,
    sort: str = "name", order: Literal["asc", "desc"] = "asc",
):
    stmt = select(Skill).where(Skill.user_id == user.id)
    if q:
        stmt = stmt.where(or_(Skill.name.ilike(like_pattern(q), escape="\\"), Skill.notes.ilike(like_pattern(q), escape="\\")))
    if category:
        stmt = stmt.where(Skill.category == category)
    if level:
        stmt = stmt.where(Skill.level == level)
    items, total = paginate(db, stmt.order_by(ordering(SORTS, sort, order), Skill.id), params)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.post("", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(body: SkillCreate, user: Student, db: DB):
    _dup(db, user.id, body.name)
    skill = Skill(user_id=user.id, **body.model_dump())
    db.add(skill)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="skill.created", entity_type="skill", entity_id=skill.id, summary=skill.name)
    db.commit()
    return skill


@router.get("/{skill_id}", response_model=SkillOut)
def get_skill(skill_id: uuid.UUID, user: Student, db: DB):
    return get_owned_or_404(db, Skill, skill_id, user.id, "Skill")


@router.patch("/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: uuid.UUID, body: SkillUpdate, user: Student, db: DB):
    skill = get_owned_or_404(db, Skill, skill_id, user.id, "Skill")
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        _dup(db, user.id, data["name"], exclude=skill.id)
    apply_update(skill, data, {"name", "category", "level", "is_public"})
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="skill.updated", entity_type="skill", entity_id=skill.id, summary=skill.name)
    db.commit()
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(skill_id: uuid.UUID, user: Student, db: DB):
    skill = get_owned_or_404(db, Skill, skill_id, user.id, "Skill")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="skill.deleted", entity_type="skill", entity_id=skill.id, summary=skill.name)
    db.delete(skill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
