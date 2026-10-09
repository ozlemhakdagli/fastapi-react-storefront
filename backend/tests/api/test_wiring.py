"""Wiring tests: app factory, error rendering, auth dependencies, media and fixtures."""

from fastapi.testclient import TestClient

from app.deps import AdminUser, CurrentUser, OptionalUser
from app.errors import ApiError
from app.main import create_app
from app.security import create_access_token


def test_health_ok(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": True}


def test_health_reports_503_when_the_database_is_unreachable(
    client: TestClient, monkeypatch
) -> None:
    def broken(*args, **kwargs):
        raise RuntimeError("database down")

    monkeypatch.setattr(client.app.state.pool, "connection", broken)
    response = client.get("/api/health")
    assert response.status_code == 503
    assert response.json() == {"status": "error", "db": False}


def test_unknown_route_is_json_404(client: TestClient) -> None:
    response = client.get("/api/no/such/route")
    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")
    assert response.json() == {"detail": "not_found"}


def test_responses_forbid_content_type_sniffing(client: TestClient) -> None:
    assert client.get("/api/health").headers["x-content-type-options"] == "nosniff"


def test_api_docs_are_served_only_when_enabled(settings) -> None:
    for enabled, status in ((True, 200), (False, 404)):
        app = create_app(settings.model_copy(update={"api_docs_enabled": enabled}))
        with TestClient(app) as client:
            assert client.get("/api/docs").status_code == status, enabled
            assert client.get("/api/openapi.json").status_code == status, enabled
            assert client.get("/api/health").status_code == 200
        # The route-security tests walk the schema, so it must list the routes in both cases.
        paths = app.openapi()["paths"]
        assert "/api/site" in paths and "/api/admin/site" in paths


def test_api_error_is_rendered(client: TestClient) -> None:
    def boom() -> None:
        raise ApiError(409, "email_taken")

    client.app.add_api_route("/api/_test/boom", boom)
    response = client.get("/api/_test/boom")
    assert response.status_code == 409
    assert response.json() == {"detail": "email_taken"}


def _add_me_route(client: TestClient) -> None:
    def me(user: CurrentUser) -> dict:
        return {"id": user["id"], "email": user["email"], "keys": sorted(user)}

    client.app.add_api_route("/api/_test/me", me)


def test_current_user_dependency(client: TestClient, make_user, auth_headers) -> None:
    _add_me_route(client)
    user = make_user()
    good = client.get("/api/_test/me", headers=auth_headers(user))
    assert good.status_code == 200
    assert good.json()["id"] == user["id"]
    assert "password_hash" not in good.json()["keys"]

    inactive = make_user(is_active=False)
    bad_headers = [
        {},
        {"Authorization": "Token abc"},
        {"Authorization": "Bearer"},
        {"Authorization": "Bearer not-a-jwt"},
        {"Authorization": f"Bearer {create_access_token(user['id'], 0, minutes=-1)}"},
        {"Authorization": f"Bearer {create_access_token(user['id'] + 9999, 0)}"},
        auth_headers(inactive),
    ]
    for headers in bad_headers:
        response = client.get("/api/_test/me", headers=headers)
        assert response.status_code == 401, headers
        assert response.json() == {"detail": "unauthorized"}, headers


def test_optional_user_dependency(client: TestClient, make_user, auth_headers) -> None:
    def who(user: OptionalUser) -> dict:
        return {"id": user["id"] if user else None}

    client.app.add_api_route("/api/_test/who", who)
    user = make_user()
    assert client.get("/api/_test/who").json() == {"id": None}
    assert client.get("/api/_test/who", headers={"Authorization": "Bearer bad"}).json() == {
        "id": None
    }
    assert client.get("/api/_test/who", headers=auth_headers(user)).json() == {"id": user["id"]}


def test_require_admin(client: TestClient, make_user, auth_headers) -> None:
    def only_admin(user: AdminUser) -> dict:
        return {"role": user["role"]}

    client.app.add_api_route("/api/_test/admin", only_admin)
    customer = client.get("/api/_test/admin", headers=auth_headers(make_user()))
    assert customer.status_code == 403
    assert customer.json() == {"detail": "forbidden"}
    admin = client.get("/api/_test/admin", headers=auth_headers(make_user(role="admin")))
    assert admin.status_code == 200
    assert admin.json() == {"role": "admin"}
    assert client.get("/api/_test/admin").status_code == 401


def test_placeholder_is_served(client: TestClient, settings) -> None:
    response = client.get("/api/media/placeholder.svg")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert (settings.upload_dir / "placeholder.svg").exists()


def test_every_router_module_exports_both_routers() -> None:
    import importlib

    for name in (
        "auth", "users", "taxonomy", "site", "products", "cart", "orders", "comments",
        "messages", "dashboard",
    ):  # fmt: skip
        module = importlib.import_module(f"app.routers.{name}")
        assert module.router is not None
        assert module.admin_router.dependencies, f"{name}.admin_router must require admin"


def test_truncation_first_test_creates_the_shared_email(make_user) -> None:
    assert make_user(email="same@example.com")["id"] >= 1


def test_truncation_second_test_creates_the_shared_email_again(make_user) -> None:
    assert make_user(email="same@example.com")["id"] >= 1


def test_factories_insert_valid_rows(
    make_user,
    make_category,
    make_brand,
    make_product,
    make_image,
    make_cart_item,
    make_order,
    make_comment,
    make_message,
    auth_headers,
    admin_headers,
) -> None:
    user = make_user()
    category = make_category()
    brand = make_brand()
    product = make_product(category_id=category["id"], brand_id=brand["id"], cost_price="60.00")
    rows = [
        user,
        category,
        brand,
        product,
        make_image(product["id"]),
        make_cart_item(user["id"], product["id"], 2),
        make_order(user["id"], items=((product["id"], 3),)),
        make_comment(product["id"], user["id"]),
        make_message(),
        make_message(direction="outbound", user_id=user["id"], status="read"),
    ]
    for row in rows:
        assert isinstance(row, dict)
        assert row["id"] >= 1
    assert user["password"] == "Passw0rd!x"
    order = rows[6]
    assert str(order["total"]) == "300.00"
    assert order["items"][0]["quantity"] == 3
    assert set(auth_headers(user)) == {"Authorization"}
    assert set(admin_headers()) == {"Authorization"}


def _add_page_route(client: TestClient) -> None:
    from app.deps import Pagination

    def page_info(p: Pagination) -> dict:
        return {"page": p.page, "page_size": p.page_size, "limit": p.limit, "offset": p.offset}

    client.app.add_api_route("/api/_test/page", page_info)


def test_pagination_defaults_and_offsets(client: TestClient) -> None:
    _add_page_route(client)
    assert client.get("/api/_test/page").json() == {
        "page": 1,
        "page_size": 20,
        "limit": 20,
        "offset": 0,
    }
    assert client.get("/api/_test/page?page=3&page_size=50").json() == {
        "page": 3,
        "page_size": 50,
        "limit": 50,
        "offset": 100,
    }


def test_pagination_rejects_out_of_range_values(client: TestClient) -> None:
    _add_page_route(client)
    for query in ("page=0", "page=-1", "page_size=0", "page_size=101", "page=x"):
        assert client.get(f"/api/_test/page?{query}").status_code == 422, query
