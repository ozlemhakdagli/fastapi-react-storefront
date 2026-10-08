"""Image files on disk: type detection by magic bytes, generated file names and removal."""

import uuid
from pathlib import Path

from app.media import PLACEHOLDER_FILE

_EXTENSIONS = {"jpeg": "jpg", "png": "png", "webp": "webp"}


def detect_image_type(head: bytes) -> str | None:
    """The image type that the leading magic bytes name, or None for anything else."""
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def store_image(upload_dir: Path, data: bytes, kind: str) -> str:
    """Write the image under a generated name and return that name. Client names are never used."""
    file_name = f"{uuid.uuid4().hex}.{_EXTENSIONS[kind]}"
    (upload_dir / file_name).write_bytes(data)
    return file_name


def remove_image_file(upload_dir: Path, file_name: str) -> None:
    """Delete an uploaded file if it is still there. The shared placeholder is never deleted."""
    if file_name != PLACEHOLDER_FILE:
        (upload_dir / file_name).unlink(missing_ok=True)
