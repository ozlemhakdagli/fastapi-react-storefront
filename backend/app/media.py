"""Helpers for product media served at /api/media."""

PLACEHOLDER_FILE = "placeholder.svg"


def image_url(file_name: str | None) -> str:
    """Public URL of an uploaded file; products without an image use the placeholder."""
    return f"/api/media/{file_name or PLACEHOLDER_FILE}"
