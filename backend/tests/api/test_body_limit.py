"""Request bodies are limited before any route (or authentication) reads them."""

from collections.abc import Iterator

from fastapi.testclient import TestClient

from app.middleware import DEFAULT_LIMIT

TOO_LARGE = {"detail": "payload_too_large"}


def _chunks(total: int, size: int = 64 * 1024) -> Iterator[bytes]:
    sent = 0
    while sent < total:
        piece = min(size, total - sent)
        yield b"x" * piece
        sent += piece


def test_an_oversized_json_body_is_refused_before_it_is_parsed(client: TestClient) -> None:
    body = b'{"email": "' + b"a" * (DEFAULT_LIMIT + 1) + b'"}'
    response = client.post(
        "/api/auth/login", content=body, headers={"content-type": "application/json"}
    )
    assert response.status_code == 413
    assert response.json() == TOO_LARGE


def test_a_chunked_body_without_content_length_is_cut_off(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        content=_chunks(DEFAULT_LIMIT * 4),
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 413
    assert response.json() == TOO_LARGE


def test_a_normal_request_is_not_affected(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "x"})
    assert response.status_code == 401


def test_an_anonymous_oversized_upload_is_refused_before_authentication(
    client: TestClient, settings
) -> None:
    big = b"\x89PNG\r\n\x1a\n" + b"0" * (settings.max_upload_bytes + 70_000)
    response = client.post(
        "/api/admin/products/1/images", files={"file": ("a.png", big, "image/png")}
    )
    assert response.status_code == 413
    assert response.json() == TOO_LARGE


def test_an_upload_within_the_limit_still_reaches_authentication(
    client: TestClient, settings
) -> None:
    near_limit = b"\x89PNG\r\n\x1a\n" + b"0" * (settings.max_upload_bytes - 1000)
    response = client.post(
        "/api/admin/products/1/images", files={"file": ("a.png", near_limit, "image/png")}
    )
    assert response.status_code == 401


def test_other_routes_keep_the_small_limit_even_for_admins(
    client: TestClient, admin_headers
) -> None:
    body = b'{"name": "' + b"a" * (DEFAULT_LIMIT + 1) + b'"}'
    response = client.post(
        "/api/admin/categories",
        content=body,
        headers={**admin_headers(), "content-type": "application/json"},
    )
    assert response.status_code == 413
