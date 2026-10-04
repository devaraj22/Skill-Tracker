import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select

from app.api.deps import DB, Student
from app.models import Project
from app.models.enums import ProjectStatus
from app.repositories.common import PageParams, apply_update, get_owned_or_404, like_pattern, ordering, paginate
from app.schemas.common import Page
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate, ReorderIn
from app.services.activity import log_activity

router = APIRouter(prefix="/projects", tags=["projects"])
SORTS = {"position": Project.position, "created_at": Project.created_at, "updated_at": Project.updated_at, "title": Project.title}


@router.get("", response_model=Page[ProjectOut])
def list_projects(
    user: Student, db: DB, params: Annotated[PageParams, Depends()],
    q: str | None = Query(None, max_length=80), status_: ProjectStatus | None = Query(None, alias="status"),
    is_public: bool | None = None, sort: str = "position", order: Literal["asc", "desc"] = "asc",
):
    stmt = select(Project).where(Project.user_id == user.id)
    if q:
        stmt = stmt.where(or_(Project.title.ilike(like_pattern(q), escape="\\"), Project.summary.ilike(like_pattern(q), escape="\\")))
    if status_:
        stmt = stmt.where(Project.status == status_)
    if is_public is not None:
        stmt = stmt.where(Project.is_public.is_(is_public))
    items, total = paginate(db, stmt.order_by(ordering(SORTS, sort, order), Project.id), params)
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, user: Student, db: DB):
    next_pos = (db.scalar(select(func.max(Project.position)).where(Project.user_id == user.id)) or 0) + 1
    project = Project(user_id=user.id, position=next_pos, **body.model_dump())
    db.add(project)
    db.flush()
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="project.created", entity_type="project", entity_id=project.id, summary=project.title)
    db.commit()
    return project


@router.post("/reorder", response_model=list[ProjectOut])
def reorder_projects(body: ReorderIn, user: Student, db: DB):
    """Set display order. `ids` must all be the caller's own projects; listed projects come first."""
    mine = {p.id: p for p in db.scalars(select(Project).where(Project.user_id == user.id)).all()}
    if len(set(body.ids)) != len(body.ids) or not set(body.ids) <= mine.keys():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "ids must be unique and belong to your projects")
    ordered = [mine[i] for i in body.ids] + [p for i, p in mine.items() if i not in set(body.ids)]
    for pos, p in enumerate(ordered, start=1):
        p.position = pos
    db.commit()
    return ordered


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: uuid.UUID, user: Student, db: DB):
    return get_owned_or_404(db, Project, project_id, user.id, "Project")


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: uuid.UUID, body: ProjectUpdate, user: Student, db: DB):
    project = get_owned_or_404(db, Project, project_id, user.id, "Project")
    apply_update(project, body.model_dump(exclude_unset=True), {"title", "summary", "tech_stack", "status", "is_public"})
    if project.start_date and project.end_date and project.end_date < project.start_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Completion date cannot be before the start date")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="project.updated", entity_type="project", entity_id=project.id, summary=project.title)
    db.commit()
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: uuid.UUID, user: Student, db: DB):
    project = get_owned_or_404(db, Project, project_id, user.id, "Project")
    log_activity(db, actor_id=user.id, subject_user_id=user.id, action="project.deleted", entity_type="project", entity_id=project.id, summary=project.title)
    db.delete(project)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
