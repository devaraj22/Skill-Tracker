"""Query helpers shared by routers: pagination, ownership lookup, sorting, safe search."""
import uuid
from typing import Any

from fastapi import HTTPException, Query, status
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session


class PageParams:
    def __init__(self, page: int = Query(1, ge=1, le=100000), page_size: int = Query(20, ge=1, le=100)):
        self.page = page
        self.page_size = page_size


def paginate(db: Session, stmt: Select, params: PageParams) -> tuple[list[Any], int]:
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.limit(params.page_size).offset((params.page - 1) * params.page_size)).all()
    return list(rows), total


def get_owned_or_404(db: Session, model, obj_id: uuid.UUID, user_id: uuid.UUID, label: str):
    """Return the record only if it belongs to user_id. Other users get 404 so ids cannot be probed."""
    obj = db.get(model, obj_id)
    if obj is None or obj.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{label} not found")
    return obj


def apply_update(obj, data: dict, non_nullable: set[str]) -> None:
    for key, value in data.items():
        if value is None and key in non_nullable:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"{key} cannot be empty")
        setattr(obj, key, value)


def like_pattern(q: str) -> str:
    escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def ordering(sort_map: dict[str, Any], sort: str, order: str):
    col = sort_map.get(sort)
    if col is None:
        allowed = ", ".join(sort_map)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"sort must be one of: {allowed}")
    return col.desc() if order == "desc" else col.asc()
