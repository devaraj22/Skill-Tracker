import uuid

from sqlalchemy.orm import Session

from app.models import ActivityLog


def log_activity(
    db: Session, *, actor_id: uuid.UUID | None, action: str, entity_type: str,
    entity_id: uuid.UUID | str | None = None, subject_user_id: uuid.UUID | None = None,
    summary: str | None = None, admin: bool = False,
) -> None:
    """Record an event. Callers must never pass passwords, tokens or file contents in `summary`."""
    db.add(ActivityLog(
        actor_id=actor_id, subject_user_id=subject_user_id, is_admin_action=admin, action=action,
        entity_type=entity_type, entity_id=str(entity_id) if entity_id else None,
        summary=(summary or "")[:200] or None,
    ))
