from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import get_settings
from app.models import User
from tests.conftest import PASSWORD, log_in, sign_up


def test_register_creates_student_with_hashed_password(anon, db):
    data = sign_up(anon, "new@example.com", "New Student")
    assert data["role"] == "student" and data["full_name"] == "New Student"
    user = db.query(User).filter_by(email="new@example.com").one()
    assert user.password_hash != PASSWORD and user.password_hash.startswith("$2")


def test_session_cookie_is_httponly(anon):
    r = anon.post("/api/v1/auth/register", json={"email": "c@example.com", "password": PASSWORD, "full_name": "Cookie Test"})
    cookies = r.headers.get_list("set-cookie")
    access = next(c for c in cookies if c.startswith("access_token="))
    csrf = next(c for c in cookies if c.startswith("csrf_token="))
    assert "HttpOnly" in access and "samesite=lax" in access.lower()
    assert "HttpOnly" not in csrf


def test_client_cannot_choose_role(anon, db):
    r = anon.post("/api/v1/auth/register", json={"email": "evil@example.com", "password": PASSWORD, "full_name": "Evil", "role": "admin"})
    assert r.status_code == 422
    assert db.query(User).filter_by(email="evil@example.com").count() == 0


def test_duplicate_email_is_rejected_case_insensitively(alice, new_client):
    r = new_client().post("/api/v1/auth/register", json={"email": "ALICE@example.com", "password": PASSWORD, "full_name": "Other"})
    assert r.status_code == 409


def test_duplicate_register_number_rejected(alice, new_client):
    r = new_client().post("/api/v1/auth/register", json={"email": "z@example.com", "password": PASSWORD, "full_name": "Zed", "register_number": "REG-001"})
    assert r.status_code == 409


def test_weak_password_rejected_and_never_echoed(anon):
    r = anon.post("/api/v1/auth/register", json={"email": "w@example.com", "password": "alllettersonly", "full_name": "Weak"})
    assert r.status_code == 422
    assert "alllettersonly" not in r.text


def test_passwords_over_bcrypt_byte_limit_are_rejected(anon):
    password = "A1" + (chr(0xE9) * 36)
    assert len(password) < 72 and len(password.encode("utf-8")) > 72
    register = anon.post("/api/v1/auth/register", json={"email": "long@example.com", "password": password, "full_name": "Long Password"})
    login = anon.post("/api/v1/auth/login", json={"email": "long@example.com", "password": password})
    assert register.status_code == login.status_code == 422
    assert "72 bytes" in register.text and "72 bytes" in login.text


def test_login_invalid_credentials_are_indistinguishable(alice, new_client):
    c = new_client()
    wrong = c.post("/api/v1/auth/login", json={"email": "alice@example.com", "password": "wrong-password-1"})
    unknown = c.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrong-password-1"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_me_requires_authentication(anon, alice):
    assert anon.get("/api/v1/auth/me").status_code == 401
    assert alice.get("/api/v1/auth/me").json()["email"] == "alice@example.com"


def test_logout_revokes_the_token(alice, new_client):
    token = alice.cookies.get("access_token")
    assert alice.post("/api/v1/auth/logout").status_code == 204
    replay = new_client()
    replay.cookies.set("access_token", token)
    assert replay.get("/api/v1/auth/me").status_code == 401


def test_expired_and_tampered_tokens_are_rejected(alice, new_client):
    s = get_settings()
    now = datetime.now(timezone.utc)
    expired = jwt.encode({"sub": alice.user["id"], "tv": 0, "exp": now - timedelta(minutes=1)}, s.secret_key, algorithm="HS256")
    forged = jwt.encode({"sub": alice.user["id"], "tv": 0, "exp": now + timedelta(minutes=5)}, "a-different-secret-key-0123456789abcdef", algorithm="HS256")
    for token in (expired, forged, "garbage"):
        c = new_client()
        c.cookies.set("access_token", token)
        assert c.get("/api/v1/auth/me").status_code == 401


def test_state_changing_requests_need_csrf_header(alice):
    del alice.headers["X-CSRF-Token"]
    r = alice.post("/api/v1/skills", json={"name": "Python", "category": "programming", "level": "beginner"})
    assert r.status_code == 403


def test_roles_are_enforced(alice, admin, anon):
    assert anon.get("/api/v1/admin/analytics").status_code == 401
    assert alice.get("/api/v1/admin/analytics").status_code == 403
    assert admin.get("/api/v1/admin/analytics").status_code == 200
    assert admin.get("/api/v1/skills").status_code == 403  # admins have no student records


def test_deactivated_account_cannot_use_session_or_login(alice, admin, new_client):
    r = admin.patch(f"/api/v1/admin/students/{alice.user['id']}/status", json={"is_active": False})
    assert r.status_code == 200 and r.json()["is_active"] is False
    assert alice.get("/api/v1/auth/me").status_code in (401, 403)
    assert new_client().post("/api/v1/auth/login", json={"email": "alice@example.com", "password": PASSWORD}).status_code == 403
    admin.patch(f"/api/v1/admin/students/{alice.user['id']}/status", json={"is_active": True})
    log_in(new_client(), "alice@example.com")


def test_health(anon):
    r = anon.get("/api/v1/health")
    assert r.status_code == 200 and r.headers["x-content-type-options"] == "nosniff"
