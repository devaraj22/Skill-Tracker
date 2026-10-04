import uuid
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import case, or_, select

from app.api.deps import DB, Student
from app.models import LearningGoal
from app.models.enums import GoalStatus, Priority, SkillCategory
from app.repositories.common import PageParams, apply_update, get_owned_or_404, like_pattern, ordering, paginate
from app.schemas.common import Page
from app.schemas.goal import GoalCreate, GoalOut, GoalUpdate
from app.services.activity import log_activity
from app.services.goals import normalize_goal_state

router = APIRouter(prefix="/goals", tags=["learning goals"])
PRIORITY_RANK = case({Priority.low: 1, Priority.medium: 2, Priority.high: 3}, value=LearningGoal.priority)
SORTS = {"target_date": LearningGoal.target_date, "priority": PRIORITY_RANK, "progress": LearningGoal.progress, "created_at": LearningGoal.created_at, "title": LearningGoal.title}


@router.get("", response_model=Page[GoalOut])
def list_goals(
    user: Student, db: DB, params: Annotated[PageParams, Depends()],
    q: str | None = Query(None, max_length=80), status_: GoalStatus | None = Query(None, alias="status"),
    category: SkillCategory | None = None, overdue: bool | None = None, upcoming: bool | None = None,
    sort: str = "target_date", order: Literal["asc", "desc"] = "asc",
):
    stmt = select(LearningGoal).where(LearningGoal.user_id == user.id)
    if q:
        stmt = stmt.where(or_(LearningGoal.title.ilike(like_pattern(q), escape="\\"), LearningGoal.description.ilike(like_pattern(q), escape="\\")))
    if status_:
        stmt = stmt.where(LearningGoal.status == status_)
    if category:
        stmt = stmt.where(LearningGoal.category == category)
    today = date.today()
    if overdue:
        stmt = stmt.where(LearningGoal.status != GoalStatus.completed, LearningGoal.target_date < today)
    if upcoming:
        stmt = stmt.where(LearningGoal.status != GoalStatus.completed, LearningGoal.target_date >= today)
    items, total = paginate(db, stmt.order_by(ordering(SORTS, sort, order), LearningGoal.id), params)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(body: GoalCreate, user: Student, db: DB):
    data = body.model_dump()
    data["status"], data["progress"] = normalize_goal_state(body.status, body.progress, "status" in body.model_fields_set)
    goal = LearningGoal(user_id=user.id, **data)
    db.add(goal)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="goal.created", entity_type="goal", entity_id=goal.id, summary=goal.title)
    db.commit()
    return goal


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: uuid.UUID, body: GoalUpdate, user: Student, db: DB):
    goal = get_owned_or_404(db, LearningGoal, goal_id, user.id, "Goal")
    data = body.model_dump(exclude_unset=True)
    apply_update(goal, data, {"title", "category", "priority", "progress", "status"})
    goal.status, goal.progress = normalize_goal_state(goal.status, goal.progress, "status" in data)
    action = "goal.completed" if goal.status == GoalStatus.completed else "goal.updated"
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action=action, entity_type="goal", entity_id=goal.id, summary=goal.title)
    db.commit()
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: uuid.UUID, user: Student, db: DB):
    goal = get_owned_or_404(db, LearningGoal, goal_id, user.id, "Goal")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="goal.deleted", entity_type="goal", entity_id=goal.id, summary=goal.title)
    db.delete(goal)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
