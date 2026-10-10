"""Whitespace-only text is refused wherever a value is required, and text is stored trimmed."""

from fastapi.testclient import TestClient

BLANK = "   "


def test_register_refuses_a_blank_name_and_trims_a_padded_one(client: TestClient) -> None:
    body = {"email": "blank@example.com", "password": "Passw0rd!x", "full_name": BLANK}
    assert client.post("/api/auth/register", json=body).status_code == 422
    padded = client.post("/api/auth/register", json={**body, "full_name": "  Ayşe Yılmaz  "})
    assert padded.status_code == 201
    assert padded.json()["full_name"] == "Ayşe Yılmaz"


def test_contact_refuses_blank_fields(client: TestClient) -> None:
    body = {"name": "Ayşe", "email": "a@example.com", "subject": "Hello", "body": "Text"}
    for field in ("name", "subject", "body"):
        assert client.post("/api/contact", json={**body, field: BLANK}).status_code == 422, field
    assert client.post("/api/contact", json=body).status_code == 201


def test_comments_refuse_a_blank_body(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    product = make_product()
    headers = auth_headers(make_user())
    url = f"/api/products/{product['id']}/comments"
    assert client.post(url, json={"body": BLANK}, headers=headers).status_code == 422
    ok = client.post(url, json={"body": "  nice  "}, headers=headers)
    assert ok.status_code == 201
    assert ok.json()["body"] == "nice"


def test_orders_refuse_blank_shipping_fields(client: TestClient, make_user, auth_headers) -> None:
    body = {"ship_name": "Ayşe", "ship_phone": "555", "ship_address": "Moda Cad. 1"}
    headers = auth_headers(make_user())
    for field in body:
        response = client.post("/api/orders", json={**body, field: BLANK}, headers=headers)
        assert response.status_code == 422, field


def test_admin_product_refuses_a_blank_name(client: TestClient, admin_headers) -> None:
    body = {"sku": "BLANK-1", "name": BLANK, "price": "10.00", "stock": 1}
    assert client.post("/api/admin/products", json=body, headers=admin_headers()).status_code == 422


def test_admin_reply_refuses_blank_fields(client: TestClient, admin_headers, make_user) -> None:
    body = {"user_id": make_user()["id"], "subject": "Re: question", "body": "Answer"}
    headers = admin_headers()
    for field in ("subject", "body"):
        response = client.post("/api/admin/messages", json={**body, field: BLANK}, headers=headers)
        assert response.status_code == 422, field
