from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def make_engine(url: str, **kwargs) -> Engine:
    engine = create_engine(url, pool_pre_ping=True, **kwargs)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def _fk_on(dbapi_conn, _):  # SQLite ignores foreign keys unless enabled
            dbapi_conn.execute("PRAGMA foreign_keys=ON")
    return engine


_engine: Engine | None = None
_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    global _engine, _factory
    if _engine is None:
        _engine = make_engine(get_settings().database_url)
        _factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def session_factory() -> sessionmaker[Session]:
    get_engine()
    assert _factory is not None
    return _factory


def get_db() -> Iterator[Session]:
    db = session_factory()()
    try:
        yield db
    finally:
        db.close()
