from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class DailyActivityItem(BaseModel):
    date: str
    count: int


class ActivityHeatmapOut(BaseModel):
    current_streak: int
    longest_streak: int
    total_activities: int
    active_days: int
    daily_counts: dict[str, int]
    start_date: str
    end_date: str


class BadgeOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    tier: Literal["bronze", "silver", "gold", "platinum"]
    icon: str
    unlocked: bool
    progress: int
    current_value: int
    target_value: int
    unlocked_at: datetime | None = None


class BadgesSummaryOut(BaseModel):
    unlocked_count: int
    total_count: int
    completion_percentage: int
    badges: list[BadgeOut]


class GamificationSummaryOut(BaseModel):
    heatmap: ActivityHeatmapOut
    badges: BadgesSummaryOut
