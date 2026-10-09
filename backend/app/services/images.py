"""Product images on disk: type check by magic bytes, resizing to WebP, file names and removal."""

import io
import uuid
from pathlib import Path

from PIL import Image, ImageOps

from app.media import PLACEHOLDER_FILE

# Larger images are refused, so a small file that claims a huge canvas cannot exhaust memory.
MAX_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
FULL_SIZE = (1600, 1600)
CARD_SIZE = (480, 480)


class InvalidImage(Exception):
    """The upload has an image's leading bytes but cannot be decoded, or is too large."""


def detect_image_type(head: bytes) -> str | None:
    """The image type that the leading magic bytes name, or None for anything else."""
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def process_image(data: bytes) -> tuple[bytes, bytes]:
    """Decode an upload and return the full and the card-sized copy as WebP bytes.

    Both copies keep the proportions and are never enlarged: the full copy fits into 1600 x 1600
    pixels, the card copy into 480 x 480. The EXIF rotation is applied. Pixels with transparency
    keep their alpha channel, every other mode becomes RGB, and only the first frame of an
    animation is used. The output is a new file, so camera metadata such as GPS data is dropped.
    Only the JPEG, PNG and WebP decoders are used.
    """
    try:
        with Image.open(io.BytesIO(data), formats=("JPEG", "PNG", "WEBP")) as source:
            if source.width * source.height > MAX_PIXELS:
                raise InvalidImage("more than 40 million pixels")
            source.load()
            oriented = ImageOps.exif_transpose(source)
            image = oriented.convert("RGBA" if oriented.has_transparency_data else "RGB")
    except (
        Image.UnidentifiedImageError,
        Image.DecompressionBombError,
        OSError,
        ValueError,
        SyntaxError,
    ) as exc:
        raise InvalidImage("cannot decode the image") from exc
    image.thumbnail(FULL_SIZE)  # thumbnail() only ever shrinks an image
    card = image.copy()
    card.thumbnail(CARD_SIZE)
    return _webp(image, quality=82), _webp(card, quality=80)


def _webp(image: Image.Image, quality: int) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=quality, method=4)
    return buffer.getvalue()


def store_image(upload_dir: Path, full: bytes, card: bytes) -> tuple[str, str]:
    """Write both copies under generated names and return the names. Client names are never used.

    If a write fails, the files already written for this image are removed again.
    """
    token = uuid.uuid4().hex
    file_name, thumb_name = f"{token}.webp", f"{token}-sm.webp"
    try:
        (upload_dir / file_name).write_bytes(full)
        (upload_dir / thumb_name).write_bytes(card)
    except OSError:
        remove_image_files(upload_dir, file_name, thumb_name)
        raise
    return file_name, thumb_name


def remove_image_files(upload_dir: Path, *file_names: str | None) -> None:
    """Delete uploaded files that still exist. None and the placeholder are never deleted."""
    for file_name in file_names:
        if file_name and file_name != PLACEHOLDER_FILE:
            (upload_dir / file_name).unlink(missing_ok=True)
