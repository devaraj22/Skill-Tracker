"""All database tables. Child tables reference users.id and are removed with the user."""
import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON, Boolean, CheckConstraint, Date, DateTime, Enum, Float, ForeignKey, Index,
    Integer, String, Text, UniqueConstraint, Uuid, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    AchievementType, CertStatus, GoalStatus, PlacementCategory, Priority,
    ProjectStatus, Role, SkillCategory, SkillLevel,
)


def enum_col(e: type[enum.Enum], **kw):
    """Store enums as constrained VARCHAR (portable between PostgreSQL and SQLite)."""
    return mapped_column(
        Enum(e, native_enum=False, length=32, create_constraint=True, name=e.__name__.lower(),
             values_callable=lambda x: [m.value for m in x]),
        **kw,
    )


def uuid_pk():
    return mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


def owner_fk():
    return mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = uuid_pk()
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[Role] = enum_col(Role, default=Role.student, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Incremented on logout so previously issued tokens stop working.
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    profile: Mapped["StudentProfile | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan", passive_deletes=True)
    skills: Mapped[list["Skill"]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    certifications: Mapped[list["Certification"]] = relationship(
        back_populates="user", foreign_keys="Certification.user_id", cascade="all, delete-orphan", passive_deletes=True)
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    achievements: Mapped[list["Achievement"]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    goals: Mapped[list["LearningGoal"]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    assessments: Mapped[list["PlacementAssessment"]] = relationship(back_populates="user", cascade="all, delete-orphan", passive_deletes=True)


class StudentProfile(TimestampMixin, Base):
    __tablename__ = "student_profiles"
    __table_args__ = (
        CheckConstraint("year_of_study IS NULL OR (year_of_study BETWEEN 1 AND 6)", name="year_range"),
    )
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    register_number: Mapped[str | None] = mapped_column(String(40), unique=True, nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), index=True)
    year_of_study: Mapped[int | None] = mapped_column(Integer, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(String(600))
    github_url: Mapped[str | None] = mapped_column(String(500))
    linkedin_url: Mapped[str | None] = mapped_column(String(500))
    resume_url: Mapped[str | None] = mapped_column(String(500))
    portfolio_username: Mapped[str | None] = mapped_column(String(30), unique=True, index=True)
    portfolio_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    portfolio_sections: Mapped[list] = mapped_column(
        JSON, default=lambda: ["skills", "projects", "certifications", "achievements"], nullable=False)
    user: Mapped[User] = relationship(back_populates="profile")


class Skill(TimestampMixin, Base):
    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("user_id", "name", name="user_name"),)
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = owner_fk()
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[SkillCategory] = enum_col(SkillCategory, nullable=False, index=True)
    level: Mapped[SkillLevel] = enum_col(SkillLevel, nullable=False)
    evidence_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(String(1000))
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    user: Mapped[User] = relationship(back_populates="skills")


class Certification(TimestampMixin, Base):
    __tablename__ = "certifications"
    __table_args__ = (
        CheckConstraint("expiry_date IS NULL OR expiry_date >= issue_date", name="dates"),
        # A reviewed certificate must name the reviewing administrator and time.
        CheckConstraint("status = \x27pending\x27 OR (reviewed_by_id IS NOT NULL AND reviewed_at IS NOT NULL)", name="review_recorded"),
        Index("ix_certifications_status_created", "status", "created_at"),
    )
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = owner_fk()
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    issuer: Mapped[str] = mapped_column(String(160), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    credential_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[CertStatus] = enum_col(CertStatus, default=CertStatus.pending, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Private file evidence: server-generated name only; never a client path.
    file_key: Mapped[str | None] = mapped_column(String(80))
    file_mime: Mapped[str | None] = mapped_column(String(80))
    file_size: Mapped[int | None] = mapped_column(Integer)
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_notes: Mapped[str | None] = mapped_column(String(1000))
    user: Mapped[User] = relationship(back_populates="certifications", foreign_keys=[user_id])
    reviewer: Mapped[User | None] = relationship(foreign_keys=[reviewed_by_id])

    @property
    def has_file(self) -> bool:
        return self.file_key is not None


class Project(TimestampMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint("end_date IS NULL OR start_date IS NULL OR end_date >= start_date", name="dates"),
    )
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = owner_fk()
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    tech_stack: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    repo_url: Mapped[str | None] = mapped_column(String(500))
    demo_url: Mapped[str | None] = mapped_column(String(500))
    cover_image_url: Mapped[str | None] = mapped_column(String(500))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ProjectStatus] = enum_col(ProjectStatus, default=ProjectStatus.in_progress, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    user: Mapped[User] = relationship(back_populates="projects")


class Achievement(TimestampMixin, Base):
    __tablename__ = "achievements"
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = owner_fk()
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    kind: Mapped[AchievementType] = enum_col(AchievementType, nullable=False, index=True)
    organization: Mapped[str] = mapped_column(String(160), nullable=False)
    result: Mapped[str | None] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(String(2000))
    achieved_on: Mapped[date] = mapped_column(Date, nullable=False)
    evidence_url: Mapped[str | None] = mapped_column(String(500))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user: Mapped[User] = relationship(back_populates="achievements")


class LearningGoal(TimestampMixin, Base):
    __tablename__ = "learning_goals"
    __table_args__ = (
        CheckConstraint("progress BETWEEN 0 AND 100", name="progress_range"),
        Index("ix_learning_goals_user_status", "user_id", "status"),
    )
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = owner_fk()
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))
    category: Mapped[SkillCategory] = enum_col(SkillCategory, nullable=False)
    priority: Mapped[Priority] = enum_col(Priority, default=Priority.medium, nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[GoalStatus] = enum_col(GoalStatus, default=GoalStatus.not_started, nullable=False)
    user: Mapped[User] = relationship(back_populates="goals")

    @property
    def is_overdue(self) -> bool:
        return bool(self.target_date and self.status != GoalStatus.completed and self.target_date < date.today())


class PlacementAssessment(TimestampMixin, Base):
    __tablename__ = "placement_assessments"
    __table_args__ = (
        CheckConstraint("score >= 0", name="score_nonneg"),
        CheckConstraint("max_score > 0", name="max_positive"),
        CheckConstraint("score <= max_score", name="score_le_max"),
        Index("ix_placement_user_cat_date", "user_id", "category", "assessed_on"),
    )
    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = owner_fk()
    category: Mapped[PlacementCategory] = enum_col(PlacementCategory, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, nullable=False)
    assessed_on: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1000))
    user: Mapped[User] = relationship(back_populates="assessments")

    @property
    def percent(self) -> float:
        return round(self.score / self.max_score * 100, 1)


class ActivityLog(Base):
    """Student activity feed and administrator audit trail. Never stores secrets or file contents."""
    __tablename__ = "activity_logs"
    id: Mapped[uuid.UUID] = uuid_pk()
    actor_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    subject_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    is_admin_action: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(40))
    summary: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    actor: Mapped[User | None] = relationship(foreign_keys=[actor_id])
