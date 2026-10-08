"""Site settings: the public read and the admin read and replace."""

from fastapi.testclient import TestClient

SITE_KEYS = {
    "site_name",
    "description",
    "address",
    "phone",
    "email",
    "facebook",
    "instagram",
    "pinterest",
    "about_text",
    "contact_text",
}

SITE_PAYLOAD = {
    "site_name": "Test Shop",
    "description": "Hand-picked goods",
    "address": "Test Street 1, Istanbul",
    "phone": "+90 212 000 00 00",
    "email": "info@example.com",
    "facebook": "https://facebook.com/testshop",
    "instagram": "https://instagram.com/testshop",
    "pinterest": "https://pinterest.com/testshop",
    "about_text": "About the shop.",
    "contact_text": "Write to us any time.",
}


def test_site_get_returns_defaults_when_no_row_exists(client: TestClient) -> None:
    response = client.get("/api/site")
    assert response.status_code == 200
    assert response.json() == dict.fromkeys(SITE_KEYS, "")


def test_site_put_then_get_round_trips(client: TestClient, admin_headers) -> None:
    headers = admin_headers()
    put = client.put("/api/admin/site", json=SITE_PAYLOAD, headers=headers)
    assert put.status_code == 200
    assert put.json() == SITE_PAYLOAD
    assert client.get("/api/admin/site", headers=headers).json() == SITE_PAYLOAD
    assert client.get("/api/site").json() == SITE_PAYLOAD


def test_site_put_twice_keeps_a_single_row(client: TestClient, admin_headers, conn) -> None:
    headers = admin_headers()
    client.put("/api/admin/site", json=SITE_PAYLOAD, headers=headers)
    second = {**SITE_PAYLOAD, "site_name": "Renamed Shop"}
    response = client.put("/api/admin/site", json=second, headers=headers)
    assert response.status_code == 200
    assert client.get("/api/site").json() == second
    assert conn.execute("SELECT id FROM site_settings").fetchall() == [{"id": 1}]


def test_site_admin_routes_require_admin(client: TestClient, make_user, auth_headers) -> None:
    customer = auth_headers(make_user())
    routes = (
        ("GET", "/api/admin/site", None),
        ("PUT", "/api/admin/site", SITE_PAYLOAD),
    )
    for method, url, body in routes:
        anonymous = client.request(method, url, json=body)
        assert anonymous.status_code == 401, url
        assert anonymous.json() == {"detail": "unauthorized"}, url
        forbidden = client.request(method, url, json=body, headers=customer)
        assert forbidden.status_code == 403, url
        assert forbidden.json() == {"detail": "forbidden"}, url


def test_public_site_has_no_extra_keys(client: TestClient, admin_headers) -> None:
    client.put("/api/admin/site", json=SITE_PAYLOAD, headers=admin_headers())
    response = client.get("/api/site")
    assert response.status_code == 200
    assert set(response.json()) == SITE_KEYS
