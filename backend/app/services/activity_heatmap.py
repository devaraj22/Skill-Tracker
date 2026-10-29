from datetime import date, datetime, time, timedelta, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ActivityLog
from app.schemas.gamification import ActivityHeatmapOut


def compute_activity_heatmap(db: Session, user_id: uuid.UUID) -> ActivityHeatmapOut:
    today = date.today()
    start_date = today - timedelta(days=364)
    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)

    # Fetch all student activity logs in the last 365 days
    logs = db.scalars(
        select(ActivityLog).where(
            ActivityLog.subject_user_id == user_id,
            ActivityLog.is_admin_action.is_(False),
            ActivityLog.created_at >= start_dt,
        )
    ).all()

    daily_counts: dict[str, int] = {}
    for log in logs:
        # Normalize to UTC or local date string
        d_str = log.created_at.date().isoformat()
        daily_counts[d_str] = daily_counts.get(d_str, 0) + 1

    total_activities = sum(daily_counts.values())
    active_days = len(daily_counts)

    # Compute current streak
    current_streak = 0
    check_date = today
    # If today has no activity yet, streak can still continue from yesterday
    if daily_counts.get(check_date.isoformat(), 0) == 0:
        check_date = today - timedelta(days=1)

    while daily_counts.get(check_date.isoformat(), 0) > 0 and check_date >= start_date:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Compute longest streak in the period
    longest_streak = 0
    temp_streak = 0
    curr = start_date
    while curr <= today:
        if daily_counts.get(curr.isoformat(), 0) > 0:
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
        else:
            temp_streak = 0
        curr += timedelta(days=1)

    return ActivityHeatmapOut(
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_activities=total_activities,
        active_days=active_days,
        daily_counts=daily_counts,
        start_date=start_date.isoformat(),
        end_date=today.isoformat(),
    )
