from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DB
from app.schemas.goal import GoalOut
from app.schemas.roadmap import (
    EnrollRoadmapGoalIn, RoadmapPlanOut, RoleOverview,
)
from app.services.learning_roadmap import (
    enroll_roadmap_milestone_as_goal, generate_roadmap_plan, list_career_roles,
)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/roles", response_model=list[RoleOverview])
def get_career_roles() -> list[RoleOverview]:
    return list_career_roles()


@router.get("/plan", response_model=RoadmapPlanOut)
def get_roadmap_plan(
    user: CurrentUser,
    db: DB,
    role_id: str = Query("fullstack_web", description="Target career role identifier"),
) -> RoadmapPlanOut:
    return generate_roadmap_plan(db, user.id, role_id)


@router.post("/enroll", response_model=GoalOut)
def enroll_milestone_as_goal(
    user: CurrentUser,
    db: DB,
    payload: EnrollRoadmapGoalIn,
) -> GoalOut:
    return enroll_roadmap_milestone_as_goal(db, user.id, payload)
