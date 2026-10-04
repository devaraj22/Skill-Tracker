"""Private certificate file storage. Files live outside any public static directory."""
import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

# extension -> (mime type, required leading bytes)
ALLOWED = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
}
_KEY_RE = re.compile(r"^[a-f0-9]{32}\.(pdf|png|jpg)$")


def _root() -> Path:
    root = get_settings().upload_dir
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_certificate_file(upload: UploadFile) -> tuple[str, str, int]:
    """Validate and store an upload. Returns (server filename, mime, size)."""
    s = get_settings()
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Only PDF, PNG or JPG files are allowed")
    mime, magic = ALLOWED[ext]
    if (upload.content_type or "").lower() != mime:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "File type does not match its extension")

    key = uuid.uuid4().hex + (".jpg" if ext == ".jpeg" else ext)
    dest = _root() / key
    size, first = 0, b""
    try:
        with dest.open("wb") as out:
            while chunk := upload.file.read(64 * 1024):
                if not first:
                    first = chunk[:16]
                size += len(chunk)
                if size > s.max_upload_bytes:
                    raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File exceeds {s.max_upload_bytes // (1024 * 1024)} MB")
                out.write(chunk)
        if size == 0 or not first.startswith(magic):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "File content does not match a valid PDF, PNG or JPG")
    except Exception:
        dest.unlink(missing_ok=True)
        raise
    return key, mime, size


def file_path(key: str) -> Path:
    if not _KEY_RE.match(key):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    path = _root() / key
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return path


def delete_file(key: str | None) -> None:
    if key and _KEY_RE.match(key):
        (_root() / key).unlink(missing_ok=True)
