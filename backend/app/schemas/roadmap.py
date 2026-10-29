from datetime import date
from typing import Literal
from pydantic import BaseModel

from app.models.enums import Priority, SkillCategory, SkillLevel


class RoleOverview(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    estimated_duration: str
    milestones_count: int


class RoadmapResource(BaseModel):
    title: str
    url: str
    type: Literal["docs", "course", "tutorial", "guide", "roadmap", "practice"]
    is_free: bool = True


class RoadmapMilestone(BaseModel):
    id: str
    title: str
    category: SkillCategory
    target_level: SkillLevel
    phase: int
    phase_name: str
    description: str
    status: Literal["mastered", "in_progress", "gap"]
    current_level: SkillLevel | None = None
    resources: list[RoadmapResource]
    is_enrolled: bool = False
    enrolled_goal_id: str | None = None


class RoadmapPlanOut(BaseModel):
    role_id: str
    role_title: str
    role_description: str
    icon: str
    match_percentage: int
    readiness_level: Literal["Beginner", "Developing", "Industry Ready"]
    mastered_count: int
    in_progress_count: int
    gap_count: int
    milestones: list[RoadmapMilestone]


class EnrollRoadmapGoalIn(BaseModel):
    role_id: str
    milestone_id: str
    title: str
    category: SkillCategory
    priority: Priority = Priority.medium
    target_date: date | None = None
