"""Security headers: API answers carry them; media files and the documentation pages do not."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
}


@pytest.mark.parametrize(
    ("path", "status"),
    [
        ("/api/health", 200),
        ("/api/no/such/route", 404),
        ("/api/admin/site", 401),
        ("/api/products", 200),
    ],
)
def test_api_answers_carry_the_security_headers(client: TestClient, path: str, status: int) -> None:
    response = client.get(path)
    assert response.status_code == status
    for name, value in SECURITY_HEADERS.items():
        assert response.headers[name] == value, name


UPLOADED = "ab" * 16 + ".webp"


def test_media_files_get_cache_headers_instead_of_the_api_headers(client: TestClient) -> None:
    response = client.get("/api/media/placeholder.svg")
    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "public, max-age=86400"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert "X-Frame-Options" not in response.headers
    assert "Referrer-Policy" not in response.headers


def test_uploaded_files_may_be_kept_for_a_year(client: TestClient, settings) -> None:
    path = settings.upload_dir / UPLOADED
    path.write_bytes(b"RIFF\x00\x00\x00\x00WEBP")
    try:
        response = client.get(f"/api/media/{UPLOADED}")
    finally:
        path.unlink()
    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "public, max-age=31536000, immutable"


def test_a_missing_media_file_is_never_cached(client: TestClient) -> None:
    response = client.get("/api/media/" + "cd" * 16 + ".webp")
    assert response.status_code == 404
    assert "Cache-Control" not in response.headers


def test_cors_preflight_allows_only_the_methods_and_headers_the_app_uses(settings) -> None:
    origin = "http://localhost:5173"
    app = create_app(settings.model_copy(update={"cors_origins": [origin]}))
    with TestClient(app) as client:
        allowed = client.options(
            "/api/cart/items/1",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "PUT",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert allowed.status_code == 200
        refused = client.options(
            "/api/products",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "x-anything",
            },
        )
        assert refused.status_code == 400


def test_documentation_pages_are_not_given_the_headers(settings) -> None:
    app = create_app(settings.model_copy(update={"api_docs_enabled": True}))
    with TestClient(app) as client:
        for path in ("/api/docs", "/api/openapi.json"):
            response = client.get(path)
            assert response.status_code == 200, path
            for name in SECURITY_HEADERS:
                assert name not in response.headers, (path, name)
