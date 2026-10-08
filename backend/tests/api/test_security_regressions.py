"""Regression tests for security-relevant behaviour."""

import subprocess
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient

from app.security import create_access_token

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_there_is_no_order_deletion_endpoint(client: TestClient) -> None:
    """There is no admin 'delete order' action that could delete a product."""
    paths = client.app.openapi()["paths"]
    for path, operations in paths.items():
        if "/orders" in path:
            assert "delete" not in operations, f"DELETE {path} must not exist"


def test_no_env_file_is_tracked_by_git() -> None:
    """Secrets live in .env, and only .env.example files are committed."""
    try:
        listing = subprocess.run(  # noqa: S603
            ["git", "ls-files"],  # noqa: S607
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.splitlines()
    except OSError, subprocess.CalledProcessError:
        pytest.skip("not a git checkout")
    tracked_env = [name for name in listing if Path(name).name == ".env"]
    assert tracked_env == []


def test_cors_allows_only_the_configured_origin(client: TestClient) -> None:
    allowed = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-credentials" not in allowed.headers
    for origin in ("http://evil.example", "null"):
        foreign = client.get("/api/health", headers={"Origin": origin})
        assert "access-control-allow-origin" not in foreign.headers, origin


@pytest.mark.filterwarnings("ignore:The HMAC key is")
@pytest.mark.parametrize("algorithm", ["HS512", "HS384", "none"])
def test_tokens_with_other_algorithms_are_rejected(
    client: TestClient, make_user, settings, algorithm: str
) -> None:
    user = make_user()
    claims = {"sub": str(user["id"]), "iat": 1, "exp": 4_000_000_000}
    key = "" if algorithm == "none" else settings.secret_key
    token = jwt.encode(claims, key, algorithm=algorithm)
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_a_token_without_an_expiry_is_rejected(client: TestClient, make_user, settings) -> None:
    user = make_user()
    token = jwt.encode({"sub": str(user["id"]), "iat": 1}, settings.secret_key, algorithm="HS256")
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_the_media_mount_does_not_serve_files_outside_the_upload_folder(
    client: TestClient,
) -> None:
    for path in ("/api/media/../../.env", "/api/media/%2e%2e/%2e%2e/.env", "/api/media/..%2f.env"):
        assert client.get(path).status_code == 404, path


def test_validation_errors_do_not_echo_the_submitted_values(client: TestClient) -> None:
    secret = "short1"
    response = client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "password": secret, "full_name": "A"},
    )
    assert response.status_code == 422
    assert secret not in response.text
    errors = response.json()["detail"]
    assert errors and all("input" not in error and "ctx" not in error for error in errors)
    assert errors[0]["loc"] == ["body", "password"]


@pytest.mark.parametrize(
    "url",
    [
        "/api/products?page=99999999999999999999",
        "/api/products?page=9223372036854775807&page_size=100",
        "/api/products?q=%00",
    ],
)
def test_hostile_query_values_give_422_not_500(client: TestClient, url: str) -> None:
    assert client.get(url).status_code == 422


@pytest.mark.parametrize("escaped", [r"x\u0000y", r"x\ud800y"])
def test_nul_and_lone_surrogates_in_text_give_422_not_500(client: TestClient, escaped: str) -> None:
    # Sent as raw JSON with the escape sequence: that is how a hostile client would send it.
    body = (
        '{"name": "A", "email": "a@example.com", "body": "Hello", "subject": "' + escaped + '"}'
    ).encode()
    response = client.post(
        "/api/contact", content=body, headers={"content-type": "application/json"}
    )
    # A lone surrogate is refused by JSON validation, a NUL by the database handler: both are 422.
    assert response.status_code == 422


def test_a_price_above_one_million_is_refused(client: TestClient, admin_headers) -> None:
    headers = admin_headers()
    body = {"sku": "BIG-1", "name": "Big", "price": "1000000.01", "stock": 1}
    assert client.post("/api/admin/products", json=body, headers=headers).status_code == 422
    body = {**body, "price": "1000000.00", "cost_price": "1000000.01"}
    assert client.post("/api/admin/products", json=body, headers=headers).status_code == 422
    body = {**body, "cost_price": "1000000.00"}
    assert client.post("/api/admin/products", json=body, headers=headers).status_code == 201


def test_a_full_cart_of_the_most_expensive_product_still_works(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    user = make_user()
    product = make_product(price="1000000.00", stock=99)
    headers = auth_headers(user)
    added = client.post(
        "/api/cart/items", json={"product_id": product["id"], "quantity": 99}, headers=headers
    )
    assert added.status_code == 200
    assert added.json()["total"] == "99000000.00"
    order = client.post(
        "/api/orders",
        json={"ship_name": "A", "ship_phone": "1", "ship_address": "Somewhere 1"},
        headers=headers,
    )
    assert order.status_code == 201
    assert create_access_token(user["id"])  # token helper still importable
