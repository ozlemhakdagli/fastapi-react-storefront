"""Helpers for product media served at /api/media."""

PLACEHOLDER_FILE = "placeholder.svg"


def image_url(file_name: str | None) -> str:
    """Public URL of an uploaded file; products without an image use the placeholder."""
    return f"/api/media/{file_name or PLACEHOLDER_FILE}"


def card_image_url(file_name: str | None, thumb_name: str | None) -> str:
    """The card-sized copy when there is one, else the full file, else the placeholder."""
    return image_url(thumb_name or file_name)
