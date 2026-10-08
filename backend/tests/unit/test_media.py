from app.media import PLACEHOLDER_FILE, image_url


def test_image_url_points_at_the_media_mount() -> None:
    assert image_url("abc123.png") == "/api/media/abc123.png"


def test_image_url_falls_back_to_the_placeholder() -> None:
    assert PLACEHOLDER_FILE == "placeholder.svg"
    assert image_url(None) == "/api/media/placeholder.svg"
    assert image_url("") == "/api/media/placeholder.svg"
