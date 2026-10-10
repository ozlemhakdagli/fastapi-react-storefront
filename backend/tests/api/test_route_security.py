"""Walks every route of the application and checks who may call it.

The two tests below are the safety net for forgotten auth dependencies: a new endpoint that is
not listed as public here, and is not protected, fails with the route's name in the message.
"""

import re

from fastapi import FastAPI
from fastapi.testclient import TestClient

BODY_METHODS = {"POST", "PUT", "PATCH"}
HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}

# (method, path with every {parameter} written as {}). These are the only routes that a visitor
# without a token may call. Everything else under /api must answer 401.
PUBLIC_ROUTES = {
    ("GET", "/api/health"),
    ("POST", "/api/auth/register"),
    ("POST", "/api/auth/login"),
    ("GET", "/api/categories"),
    ("GET", "/api/brands"),
    ("GET", "/api/site"),
    ("GET", "/api/products"),
    ("GET", "/api/products/{}"),
    ("GET", "/api/products/{}/comments"),
    ("POST", "/api/contact"),
}


def _normalized(path: str) -> str:
    return re.sub(r"\{[^}]+\}", "{}", path)


def _api_routes(app: FastAPI) -> list[tuple[str, str, str]]:
    """(method, normalized path, concrete URL with every parameter replaced by 1).

    The routes come from the OpenAPI document, which lists every endpoint of the application
    (the /api/media mount and the documentation pages are not endpoints). It is the public way
    to enumerate routes; app.routes keeps included routers in private, lazily expanded objects.
    """
    found = []
    for path, operations in app.openapi()["paths"].items():
        for method in sorted(operations):
            if method.upper() in HTTP_METHODS:
                found.append((method.upper(), _normalized(path), re.sub(r"\{[^}]+\}", "1", path)))
    return found


def _call(client: TestClient, method: str, url: str, headers: dict[str, str] | None = None):
    body = {"json": {}} if method in BODY_METHODS else {}
    return client.request(method, url, headers=headers or {}, **body)


def test_the_route_walk_sees_the_whole_api(client: TestClient) -> None:
    routes = _api_routes(client.app)
    admin = [route for route in routes if route[1].startswith("/api/admin")]
    assert len(routes) >= 50, "the walk found too few routes; did the discovery break?"
    assert len(admin) >= 25, "the walk found too few admin routes"
    existing = {(method, path) for method, path, _ in routes}
    assert PUBLIC_ROUTES <= existing, (
        f"public routes that no longer exist: {PUBLIC_ROUTES - existing}"
    )


def test_every_admin_route_rejects_anonymous_and_customers(
    client: TestClient, make_user, auth_headers
) -> None:
    customer = auth_headers(make_user())
    for method, path, url in _api_routes(client.app):
        if not path.startswith("/api/admin"):
            continue
        anonymous = _call(client, method, url)
        assert anonymous.status_code == 401, (
            f"{method} {path} answered {anonymous.status_code} without a token"
        )
        forbidden = _call(client, method, url, customer)
        assert forbidden.status_code == 403, (
            f"{method} {path} answered {forbidden.status_code} to a customer"
        )
        assert forbidden.json() == {"detail": "forbidden"}, f"{method} {path}"


def test_every_non_public_route_requires_login(client: TestClient) -> None:
    for method, path, url in _api_routes(client.app):
        if (method, path) in PUBLIC_ROUTES:
            continue
        response = _call(client, method, url)
        assert response.status_code == 401, (
            f"{method} {path} answered {response.status_code} without a token"
        )
        assert response.json() == {"detail": "unauthorized"}, f"{method} {path}"
