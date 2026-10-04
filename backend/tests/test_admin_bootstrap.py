"""Tests for administrator account bootstrapping and role-based authentication."""
import pytest
from sqlalchemy import select

from app.core.security import verify_password
from app.models import User
from app.models.enums import Role
from scripts.create_admin import create_admin
from tests.conftest import PASSWORD, log_in, sign_up


def test_bootstrap_creates_initial_admin(db):
    email = "admin.bootstrap@testcollege.edu"
    admin_pw = "SecureAdminPass123"

    res = create_admin(email, admin_pw, db=db)
    assert res == 0

    user = db.scalar(select(User).where(User.email == email))
    assert user is not None
    assert user.role == Role.admin
    assert user.is_active is True
    assert user.profile is None
    assert verify_password(admin_pw, user.password_hash)


def test_bootstrap_rejects_duplicate_admin(db):
    email = "admin.bootstrap@testcollege.edu"
    admin_pw = "SecureAdminPass123"

    # First creation succeeds
    assert create_admin(email, admin_pw, db=db) == 0

    # Second creation fails with exit code 1 (no duplicate created, no changes)
    assert create_admin(email, "DifferentPass999", db=db) == 1

    # Original credentials remain intact
    user = db.scalar(select(User).where(User.email == email))
    assert verify_password(admin_pw, user.password_hash)
    assert not verify_password("DifferentPass999", user.password_hash)


def test_bootstrap_refuses_to_upgrade_student(alice, db):
    # alice is already registered as a student with email "alice@example.com"
    alice_user = db.scalar(select(User).where(User.email == "alice@example.com"))
    assert alice_user.role == Role.student
    original_hash = alice_user.password_hash

    # Attempting to bootstrap an admin with alice's email must fail
    res = create_admin("alice@example.com", "AdminPass123", db=db)
    assert res == 1

    # alice must still be a student with unmodified credentials
    db.refresh(alice_user)
    assert alice_user.role == Role.student
    assert alice_user.password_hash == original_hash


def test_bootstrap_validates_email(db):
    assert create_admin("not-an-email", "AdminPass123", db=db) == 2
    assert create_admin("", "AdminPass123", db=db) == 2


def test_bootstrap_validates_password(db):
    email = "valid.admin@testcollege.edu"
    # Too short (<10 chars)
    assert create_admin(email, "Short1", db=db) == 2
    # No numbers
    assert create_admin(email, "NoNumbersHereAtAll", db=db) == 2
    # No letters
    assert create_admin(email, "1234567890123", db=db) == 2
    # Over 72 bytes
    long_pw = "A1" + ("x" * 71)
    assert create_admin(email, long_pw, db=db) == 2


def test_bootstrapped_admin_can_login_and_access_admin_endpoints(new_client, db):
    email = "admin.login@testcollege.edu"
    admin_pw = "AdminPass123"
    assert create_admin(email, admin_pw, db=db) == 0

    client = new_client()
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": admin_pw})
    assert login_res.status_code == 200
    user_data = login_res.json()
    assert user_data["email"] == email
    assert user_data["role"] == "admin"
    assert user_data["full_name"] is None

    # CSRF token header for subsequent requests
    client.headers["X-CSRF-Token"] = client.cookies.get("csrf_token")

    # Access protected admin routes
    analytics_res = client.get("/api/v1/admin/analytics")
    assert analytics_res.status_code == 200
    assert "students" in analytics_res.json()

    students_res = client.get("/api/v1/admin/students")
    assert students_res.status_code == 200
    assert "items" in students_res.json()


def test_student_cannot_access_admin_routes(alice):
    # alice is a student
    analytics_res = alice.get("/api/v1/admin/analytics")
    assert analytics_res.status_code == 403

    students_res = alice.get("/api/v1/admin/students")
    assert students_res.status_code == 403


def test_admin_cannot_access_student_routes(new_client, db):
    email = "admin.noroutes@testcollege.edu"
    admin_pw = "AdminPass123"
    assert create_admin(email, admin_pw, db=db) == 0

    client = new_client()
    log_in(client, email, admin_pw)

    # Admin accounts do not have student profiles and cannot access student endpoints
    skills_res = client.get("/api/v1/skills")
    assert skills_res.status_code == 403

    projects_res = client.get("/api/v1/projects")
    assert projects_res.status_code == 403


def test_admin_logout_revokes_session(new_client, db):
    email = "admin.logout@testcollege.edu"
    admin_pw = "AdminPass123"
    assert create_admin(email, admin_pw, db=db) == 0

    client = new_client()
    log_in(client, email, admin_pw)

    # User /me works
    assert client.get("/api/v1/auth/me").status_code == 200

    # Logout
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 204

    # Subsequent request fails
    assert client.get("/api/v1/auth/me").status_code == 401
