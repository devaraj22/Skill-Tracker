import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.v1.router import api_router
from app.core.config import get_settings

logger = logging.getLogger("skilltrack")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="SkillTrack API", version="1.0.0", description="Student Skill & Placement Management System")

    app.add_middleware(
        CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Content-Type", "X-CSRF-Token"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        # Drop `input`/`ctx` so submitted values (e.g. passwords) are never echoed back.
        errors = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
        return JSONResponse(status_code=422, content={"detail": "Validation failed", "errors": errors})

    @app.exception_handler(IntegrityError)
    async def integrity_handler(request: Request, exc: IntegrityError):
        logger.warning("Integrity error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=409, content={"detail": "This change conflicts with existing data"})

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)  # server log only
        return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
