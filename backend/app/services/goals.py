"""Learning goal status rules (documented in docs/API.md).

* status == completed (chosen)   -> progress is forced to 100
* progress == 100                -> status becomes completed
* 0 < progress < 100             -> status becomes in_progress (a completed goal that is lowered is reopened)
* progress == 0                  -> status stays as chosen (not_started or in_progress)
"""
from datetime import date

from app.models.enums import GoalStatus


def normalize_goal_state(status: GoalStatus, progress: int, explicit_status: bool) -> tuple[GoalStatus, int]:
    if explicit_status and status == GoalStatus.completed:
        return GoalStatus.completed, 100
    if progress >= 100:
        return GoalStatus.completed, 100
    if progress > 0:
        return GoalStatus.in_progress, progress
    if status == GoalStatus.completed:  # progress lowered to 0 on a completed goal
        return GoalStatus.not_started, 0
    return status, progress


def is_overdue(target: date | None, status: GoalStatus) -> bool:
    return bool(target and status != GoalStatus.completed and target < date.today())
