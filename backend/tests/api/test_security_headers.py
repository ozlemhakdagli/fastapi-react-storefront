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


def test_media_files_are_not_given_the_headers(client: TestClient) -> None:
    response = client.get("/api/media/placeholder.svg")
    assert response.status_code == 200
    for name in SECURITY_HEADERS:
        assert name not in response.headers, name


def test_documentation_pages_are_not_given_the_headers(settings) -> None:
    app = create_app(settings.model_copy(update={"api_docs_enabled": True}))
    with TestClient(app) as client:
        for path in ("/api/docs", "/api/openapi.json"):
            response = client.get(path)
            assert response.status_code == 200, path
            for name in SECURITY_HEADERS:
                assert name not in response.headers, (path, name)
