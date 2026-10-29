from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models import StudentProfile
from app.schemas.gamification import (
    ActivityHeatmapOut, BadgesSummaryOut, GamificationSummaryOut,
)
from app.services.activity_heatmap import compute_activity_heatmap
from app.services.badges import evaluate_badges

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/heatmap", response_model=ActivityHeatmapOut)
def get_student_heatmap(user: CurrentUser, db: DB) -> ActivityHeatmapOut:
    return compute_activity_heatmap(db, user.id)


@router.get("/badges", response_model=BadgesSummaryOut)
def get_student_badges(user: CurrentUser, db: DB) -> BadgesSummaryOut:
    return evaluate_badges(db, user.id)


@router.get("/summary", response_model=GamificationSummaryOut)
def get_student_gamification_summary(user: CurrentUser, db: DB) -> GamificationSummaryOut:
    heatmap = compute_activity_heatmap(db, user.id)
    badges = evaluate_badges(db, user.id)
    return GamificationSummaryOut(heatmap=heatmap, badges=badges)


@router.get("/public/{username}", response_model=GamificationSummaryOut)
def get_public_portfolio_gamification(username: str, db: DB) -> GamificationSummaryOut:
    profile = db.scalar(
        select(StudentProfile).where(
            StudentProfile.portfolio_username == username.lower().strip(),
            StudentProfile.portfolio_public.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Portfolio not found or private")

    heatmap = compute_activity_heatmap(db, profile.user_id)
    badges = evaluate_badges(db, profile.user_id)
    return GamificationSummaryOut(heatmap=heatmap, badges=badges)
