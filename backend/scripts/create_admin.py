"""Create one administrator account without changing existing users.

Run from the backend directory:
    python scripts/create_admin.py --email admin@yourcollege.edu

Or from the project root:
    python backend/scripts/create_admin.py --email admin@yourcollege.edu

The password can be entered securely via the hidden interactive prompt,
or supplied via the SKILLTRACK_ADMIN_PASSWORD environment variable.
"""
from __future__ import annotations

import argparse
import getpass
import io
import os
import re
import sys
from pathlib import Path

# Allow this file to be run directly from any directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import session_factory
from app.models import User
from app.models.enums import Role


def _valid_password(password: str) -> bool:
    pw_bytes = password.encode("utf-8")
    return (
        10 <= len(pw_bytes) <= 72
        and re.search(r"[A-Za-z]", password) is not None
        and re.search(r"\d", password) is not None
    )


def _email(value: str) -> str:
    try:
        return str(TypeAdapter(EmailStr).validate_python(value.strip())).lower()
    except ValidationError as exc:
        raise ValueError("Enter a valid email address.") from exc


def create_admin(
    email: str | None = None,
    password: str | None = None,
    db: Session | None = None,
) -> int:
    if email is None:
        if sys.stdin.isatty():
            try:
                email = input("Administrator email: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nAborted.", file=sys.stderr)
                return 2
        else:
            print("Administrator email is required.", file=sys.stderr)
            return 2
    if not email:
        print("Administrator email is required.", file=sys.stderr)
        return 2

    try:
        normalized_email = _email(email)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if not password:
        env_pw = os.environ.get("SKILLTRACK_ADMIN_PASSWORD")
        if env_pw:
            password = env_pw
        elif sys.stdin.isatty():
            try:
                password = getpass.getpass("Admin password: ")
                confirmation = getpass.getpass("Repeat password: ")
                if password != confirmation:
                    print("Passwords do not match.", file=sys.stderr)
                    return 2
            except (EOFError, io.UnsupportedOperation):
                print(
                    "Could not read password interactively. Provide SKILLTRACK_ADMIN_PASSWORD environment variable.",
                    file=sys.stderr,
                )
                return 2
        else:
            print(
                "Password is required. Provide SKILLTRACK_ADMIN_PASSWORD environment variable in non-interactive environments.",
                file=sys.stderr,
            )
            return 2

    if not _valid_password(password):
        print("Password must be 10-72 bytes and contain at least one letter and one number.", file=sys.stderr)
        return 2

    def _execute(session: Session) -> int:
        existing = session.scalar(select(User).where(User.email == normalized_email))
        if existing:
            if existing.role == Role.admin:
                print(f"An administrator account with email '{normalized_email}' already exists; no duplicate was created.", file=sys.stderr)
            else:
                print(
                    f"An account with email '{normalized_email}' already exists with role '{existing.role.value}'. "
                    "Existing student accounts are never silently upgraded to administrator.",
                    file=sys.stderr,
                )
            return 1

        session.add(User(email=normalized_email, password_hash=hash_password(password), role=Role.admin))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            print("The account was created concurrently or already exists; no duplicate was created.", file=sys.stderr)
            return 1

        print(f"Administrator {normalized_email} created successfully.")
        return 0

    if db is not None:
        return _execute(db)
    else:
        with session_factory()() as session:
            return _execute(session)


def main() -> int:
    parser = argparse.ArgumentParser(description="Create an administrator account.")
    parser.add_argument("--email", required=False, default=None, help="Administrator email address")
    args = parser.parse_args()
    return create_admin(args.email)


if __name__ == "__main__":
    raise SystemExit(main())
