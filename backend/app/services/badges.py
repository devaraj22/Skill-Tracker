import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Certification, LearningGoal, PlacementAssessment, Project, Skill,
    StudentProfile,
)
from app.models.enums import CertStatus, GoalStatus, SkillLevel
from app.schemas.gamification import BadgeOut, BadgesSummaryOut
from app.services.activity_heatmap import compute_activity_heatmap


def evaluate_badges(db: Session, user_id: uuid.UUID) -> BadgesSummaryOut:
    skills = db.scalars(select(Skill).where(Skill.user_id == user_id)).all()
    certs = db.scalars(select(Certification).where(Certification.user_id == user_id)).all()
    projects = db.scalars(select(Project).where(Project.user_id == user_id)).all()
    goals = db.scalars(select(LearningGoal).where(LearningGoal.user_id == user_id)).all()
    assessments = db.scalars(select(PlacementAssessment).where(PlacementAssessment.user_id == user_id)).all()
    profile = db.scalar(select(StudentProfile).where(StudentProfile.user_id == user_id))

    heatmap = compute_activity_heatmap(db, user_id)
    max_streak = max(heatmap.current_streak, heatmap.longest_streak)

    badges: list[BadgeOut] = []

    # 1. First Step (Bronze)
    total_creations = len(skills) + len(projects)
    b1_unlocked = total_creations >= 1
    badges.append(
        BadgeOut(
            id="first_step",
            title="First Step",
            description="Add your first skill or project to SkillTrack",
            category="skills",
            tier="bronze",
            icon="Sparkles",
            unlocked=b1_unlocked,
            progress=100 if b1_unlocked else 0,
            current_value=min(total_creations, 1),
            target_value=1,
        )
    )

    # 2. Skill Explorer (Silver)
    categories = {s.category for s in skills}
    b2_val = len(skills)
    b2_unlocked = len(skills) >= 5 and len(categories) >= 2
    badges.append(
        BadgeOut(
            id="skill_explorer",
            title="Skill Explorer",
            description="Add at least 5 skills spanning 2 or more categories",
            category="skills",
            tier="silver",
            icon="BookOpen",
            unlocked=b2_unlocked,
            progress=min(100, int((min(b2_val, 5) / 5) * 100)),
            current_value=b2_val,
            target_value=5,
        )
    )

    # 3. Deep Specialist (Gold)
    has_expert = any(s.level in (SkillLevel.advanced, SkillLevel.expert) for s in skills)
    badges.append(
        BadgeOut(
            id="expert_mind",
            title="Deep Specialist",
            description="Achieve Advanced or Expert proficiency in at least one skill",
            category="skills",
            tier="gold",
            icon="Award",
            unlocked=has_expert,
            progress=100 if has_expert else (50 if any(s.level == SkillLevel.intermediate for s in skills) else 0),
            current_value=1 if has_expert else 0,
            target_value=1,
        )
    )

    # 4. Project Builder (Silver)
    proj_count = len(projects)
    b4_unlocked = proj_count >= 2
    badges.append(
        BadgeOut(
            id="project_builder",
            title="Project Builder",
            description="Build and record 2 or more academic or portfolio projects",
            category="projects",
            tier="silver",
            icon="FolderGit2",
            unlocked=b4_unlocked,
            progress=min(100, int((min(proj_count, 2) / 2) * 100)),
            current_value=proj_count,
            target_value=2,
        )
    )

    # 5. Certified Pro (Gold)
    verified_certs = sum(1 for c in certs if c.status == CertStatus.verified)
    b5_unlocked = verified_certs >= 1
    badges.append(
        BadgeOut(
            id="certified_pro",
            title="Certified Pro",
            description="Earn at least 1 verified certificate approved by faculty",
            category="certifications",
            tier="gold",
            icon="ShieldCheck",
            unlocked=b5_unlocked,
            progress=100 if b5_unlocked else (50 if len(certs) > 0 else 0),
            current_value=verified_certs,
            target_value=1,
        )
    )

    # 6. Goal Crusher (Gold)
    completed_goals = sum(1 for g in goals if g.status == GoalStatus.completed)
    b6_unlocked = completed_goals >= 3
    badges.append(
        BadgeOut(
            id="goal_crusher",
            title="Goal Crusher",
            description="Reach 100% and complete 3 or more learning goals",
            category="goals",
            tier="gold",
            icon="Target",
            unlocked=b6_unlocked,
            progress=min(100, int((min(completed_goals, 3) / 3) * 100)),
            current_value=completed_goals,
            target_value=3,
        )
    )

    # 7. Consistent Learner (Bronze)
    b7_unlocked = max_streak >= 3
    badges.append(
        BadgeOut(
            id="streak_3",
            title="Consistent Learner",
            description="Maintain an active 3-day learning & tracking streak",
            category="activity",
            tier="bronze",
            icon="Flame",
            unlocked=b7_unlocked,
            progress=min(100, int((min(max_streak, 3) / 3) * 100)),
            current_value=min(max_streak, 3),
            target_value=3,
        )
    )

    # 8. Streak Master (Silver)
    b8_unlocked = max_streak >= 7
    badges.append(
        BadgeOut(
            id="streak_7",
            title="Streak Master",
            description="Maintain a 7-day continuous activity streak",
            category="activity",
            tier="silver",
            icon="Zap",
            unlocked=b8_unlocked,
            progress=min(100, int((min(max_streak, 7) / 7) * 100)),
            current_value=min(max_streak, 7),
            target_value=7,
        )
    )

    # 9. Placement Prepared (Platinum)
    passed_assessments = sum(1 for a in assessments if (a.score / a.max_score) >= 0.70)
    b9_unlocked = passed_assessments >= 2
    badges.append(
        BadgeOut(
            id="placement_ready",
            title="Placement Prepared",
            description="Score 70% or higher on 2 or more placement assessments",
            category="placement",
            tier="platinum",
            icon="Trophy",
            unlocked=b9_unlocked,
            progress=min(100, int((min(passed_assessments, 2) / 2) * 100)),
            current_value=passed_assessments,
            target_value=2,
        )
    )

    # 10. Portfolio Pioneer (Bronze)
    is_public = bool(profile and profile.portfolio_username and profile.portfolio_public)
    badges.append(
        BadgeOut(
            id="portfolio_pioneer",
            title="Portfolio Pioneer",
            description="Publish your live personal web portfolio with a custom URL",
            category="portfolio",
            tier="bronze",
            icon="Globe",
            unlocked=is_public,
            progress=100 if is_public else 0,
            current_value=1 if is_public else 0,
            target_value=1,
        )
    )

    unlocked_count = sum(1 for b in badges if b.unlocked)
    total_count = len(badges)
    completion_percentage = int((unlocked_count / total_count) * 100) if total_count > 0 else 0

    return BadgesSummaryOut(
        unlocked_count=unlocked_count,
        total_count=total_count,
        completion_percentage=completion_percentage,
        badges=badges,
    )
