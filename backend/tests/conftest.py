import os
import tempfile

# Must be set before the app is imported: isolated secrets, upload dir and (in-memory) database.
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only-0123456789abcdef"
os.environ["APP_ENV"] = "test"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="skilltrack-test-uploads-")
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db, make_engine
from app.main import app
from app.models import User
from app.models.enums import Role

PASSWORD = "Passw0rd-long-1"


def _test_engine():
    """In-memory SQLite by default. Set TEST_DATABASE_URL to run the suite against PostgreSQL.

    Safety: the database name must contain "test" because tables are dropped and recreated for every test.
    """
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        return make_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    if "test" not in (make_url(url).database or "").lower():
        raise RuntimeError("Refusing to run tests: TEST_DATABASE_URL must point to a database whose name contains 'test'.")
    return make_engine(url)


@pytest.fixture()
def engine():
    eng = _test_engine()
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def db(engine):
    Session = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)

    def override():
        s = Session()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override
    with Session() as session:
        yield session
    app.dependency_overrides.clear()


@pytest.fixture()
def new_client(db):
    """Factory for independent clients (each has its own cookie jar)."""
    def make() -> TestClient:
        return TestClient(app)
    return make


def sign_up(client: TestClient, email: str, name: str = "Test Student", **extra):
    body = {"email": email, "password": PASSWORD, "full_name": name, **extra}
    r = client.post("/api/v1/auth/register", json=body)
    assert r.status_code == 201, r.text
    client.headers["X-CSRF-Token"] = client.cookies.get("csrf_token")
    return r.json()


def log_in(client: TestClient, email: str, password: str = PASSWORD):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    client.headers["X-CSRF-Token"] = client.cookies.get("csrf_token")
    return r.json()


@pytest.fixture()
def anon(new_client):
    return new_client()


@pytest.fixture()
def alice(new_client):
    c = new_client()
    c.user = sign_up(c, "alice@example.com", "Alice Demo", register_number="REG-001", department="Computer Science", year_of_study=3)
    return c


@pytest.fixture()
def bob(new_client):
    c = new_client()
    c.user = sign_up(c, "bob@example.com", "Bob Demo", register_number="REG-002", department="Electronics", year_of_study=2)
    return c


@pytest.fixture()
def admin(new_client, db):
    db.add(User(email="admin@example.com", password_hash=hash_password(PASSWORD), role=Role.admin))
    db.commit()
    c = new_client()
    c.user = log_in(c, "admin@example.com")
    return c
