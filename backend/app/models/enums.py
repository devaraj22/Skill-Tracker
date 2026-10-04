import enum


class Role(str, enum.Enum):
    student = "student"
    admin = "admin"


class SkillCategory(str, enum.Enum):
    programming = "programming"
    dsa = "dsa"
    ai_ml = "ai_ml"
    web = "web"
    databases = "databases"
    cloud = "cloud"
    tools = "tools"
    soft_skills = "soft_skills"


class SkillLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class CertStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class ProjectStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"


class AchievementType(str, enum.Enum):
    hackathon = "hackathon"
    competition = "competition"
    workshop = "workshop"
    internship = "internship"
    research = "research"
    award = "award"
    other = "other"


class GoalStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PlacementCategory(str, enum.Enum):
    coding_dsa = "coding_dsa"
    aptitude = "aptitude"
    technical = "technical"
    communication = "communication"
    mock_interview = "mock_interview"
    resume_portfolio = "resume_portfolio"
