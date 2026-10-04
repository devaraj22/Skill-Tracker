"""Command line tools.

    python -m app.cli create-admin --email admin@college.edu
    python -m app.cli seed-dev          (development only; refuses to run when APP_ENV=production)
"""
import argparse
import getpass
import os
import re
import sys
from datetime import date, timedelta

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import session_factory
from app.models import Achievement, Certification, LearningGoal, PlacementAssessment, Project, Skill, StudentProfile, User
from app.models.enums import (AchievementType, GoalStatus, PlacementCategory, Priority, ProjectStatus, Role, SkillCategory, SkillLevel)

DEV_PASSWORD = "DevPassword123"


def _valid_password(pw: str) -> bool:
    return 10 <= len(pw.encode()) <= 72 and re.search(r"[A-Za-z]", pw) and re.search(r"\d", pw)


def _email(value: str) -> str:
    try:
        return str(TypeAdapter(EmailStr).validate_python(value.strip())).lower()
    except ValidationError as exc:
        raise ValueError("Enter a valid email address.") from exc


def create_admin(args) -> int:
    try:
        email = _email(args.email)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    # Prefer the prompt so the password never appears in shell history or process lists.
    password = os.environ.get("SKILLTRACK_ADMIN_PASSWORD") or getpass.getpass("Admin password: ")
    if not os.environ.get("SKILLTRACK_ADMIN_PASSWORD") and password != getpass.getpass("Repeat password: "):
        print("Passwords do not match.", file=sys.stderr)
        return 1
    if not _valid_password(password):
        print("Password must be 10-72 bytes and contain at least one letter and one number.", file=sys.stderr)
        return 1
    with session_factory()() as db:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            if existing.role == Role.admin:
                print(f"An administrator account with email '{email}' already exists; no duplicate was created.", file=sys.stderr)
            else:
                print(
                    f"An account with email '{email}' already exists with role '{existing.role.value}'. "
                    "Existing student accounts are never silently upgraded to administrator.",
                    file=sys.stderr,
                )
            return 1
        db.add(User(email=email, password_hash=hash_password(password), role=Role.admin))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            print("The account was created concurrently or already exists; no duplicate was created.", file=sys.stderr)
            return 1
    print(f"Administrator {email} created successfully.")
    return 0


def reset_password(args) -> int:
    email = args.email.strip().lower()
    password = os.environ.get("SKILLTRACK_PASSWORD") or getpass.getpass("New password: ")
    if not os.environ.get("SKILLTRACK_PASSWORD") and password != getpass.getpass("Repeat password: "):
        print("Passwords do not match.", file=sys.stderr)
        return 1
    if not _valid_password(password):
        print("Password must be 10-72 bytes and contain at least one letter and one number.", file=sys.stderr)
        return 1
    with session_factory()() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            print(f"No user with email {email} exists.", file=sys.stderr)
            return 1
        user.password_hash = hash_password(password)
        user.token_version += 1
        db.commit()
    print(f"Password reset for {email}.")
    return 0


def seed_dev(args) -> int:
    if get_settings().is_production:
        print("Refusing to seed demo data when APP_ENV=production.", file=sys.stderr)
        return 1
    today = date.today()
    people = [
        ("Demo Student One", "demo.student1@example.com", "DEMO-001", "Computer Science", 3, "demo-student-one"),
        ("Demo Student Two", "demo.student2@example.com", "DEMO-002", "Information Technology", 2, None),
        ("Demo Student Three", "demo.student3@example.com", "DEMO-003", "Electronics", 4, None),
    ]
    with session_factory()() as db:
        if db.scalar(select(User.id).where(User.email == people[0][1])):
            print("Demo data already present; nothing to do.")
            return 0
        admin = db.scalar(select(User).where(User.role == Role.admin))
        for i, (name, email, reg, dept, year, username) in enumerate(people):
            u = User(email=email, password_hash=hash_password(DEV_PASSWORD), role=Role.student)
            u.profile = StudentProfile(full_name=name, register_number=reg, department=dept, year_of_study=year,
                                       bio="Sample fictional student for development." if username else None,
                                       portfolio_username=username, portfolio_public=bool(username))
            db.add(u)
            db.flush()
            db.add_all([
                Skill(user_id=u.id, name="Python", category=SkillCategory.programming, level=SkillLevel.intermediate),
                Skill(user_id=u.id, name="SQL", category=SkillCategory.databases, level=SkillLevel.beginner),
                Project(user_id=u.id, title="Sample project (fictional)", summary="Placeholder project for development.", tech_stack=["Python"],
                        status=ProjectStatus.in_progress, is_public=bool(username), position=1),
                LearningGoal(user_id=u.id, title="Finish a DSA course", category=SkillCategory.dsa, priority=Priority.high,
                             target_date=today + timedelta(days=30 * (i + 1)), progress=20 * (i + 1),
                             status=GoalStatus.in_progress),
                PlacementAssessment(user_id=u.id, category=PlacementCategory.aptitude, title="Sample aptitude test",
                                    score=30 + 10 * i, max_score=50, assessed_on=today - timedelta(days=7)),
                Achievement(user_id=u.id, title="Sample workshop attendance", kind=AchievementType.workshop,
                            organization="Sample Organisation", achieved_on=today - timedelta(days=60), is_public=bool(username)),
            ])
            cert = Certification(user_id=u.id, title="Sample certificate (fictional)", issuer="Sample Issuer", issue_date=today - timedelta(days=90),
                                 is_public=bool(username))
            db.add(cert)
        db.commit()
    print(f"Seeded {len(people)} fictional students. Development password for all: {DEV_PASSWORD}")
    print("Certificates are left Pending so you can try the admin review queue." if True else "")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("create-admin", help="Create an administrator account")
    p.add_argument("--email", required=True)
    p.set_defaults(func=create_admin)
    r = sub.add_parser("reset-password", help="Reset an existing user's password")
    r.add_argument("--email", required=True)
    r.set_defaults(func=reset_password)
    s = sub.add_parser("seed-dev", help="Insert clearly fictional development data")
    s.set_defaults(func=seed_dev)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
