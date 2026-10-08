"""Whole customer journeys through the HTTP API, with an admin handling the order."""

from fastapi.testclient import TestClient

SHIP = {"ship_name": "Ayşe Yılmaz", "ship_phone": "05320000000", "ship_address": "Moda Cad. 1"}


def _register_and_login(client: TestClient) -> dict[str, str]:
    credentials = {"email": "ayse@example.com", "password": "Passw0rd!x"}
    registered = client.post("/api/auth/register", json={**credentials, "full_name": "Ayşe Yılmaz"})
    assert registered.status_code == 201
    login = client.post("/api/auth/login", json=credentials)
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _stock(client: TestClient, product_id: int) -> int:
    return client.get(f"/api/products/{product_id}").json()["stock"]


def _buy(client: TestClient, headers: dict[str, str], lines: list[tuple[int, int]]) -> dict:
    for product_id, quantity in lines:
        added = client.post(
            "/api/cart/items",
            json={"product_id": product_id, "quantity": quantity},
            headers=headers,
        )
        assert added.status_code == 200
    placed = client.post("/api/orders", json=SHIP, headers=headers)
    assert placed.status_code == 201
    return placed.json()


def test_full_purchase_flow(client: TestClient, make_category, make_product, admin_headers) -> None:
    category = make_category("Disks")
    disk = make_product(price="100.00", stock=10, name="Disk", category_id=category["id"])
    cable = make_product(price="19.99", stock=5, name="Cable", category_id=category["id"])

    headers = _register_and_login(client)
    listing = client.get("/api/products", params={"category_id": category["id"]}).json()
    assert {item["id"] for item in listing["items"]} == {disk["id"], cable["id"]}

    order = _buy(client, headers, [(disk["id"], 2), (cable["id"], 3)])
    assert order["status"] == "new"
    assert order["total"] == "259.97"
    assert _stock(client, disk["id"]) == 8
    assert _stock(client, cable["id"]) == 2
    assert client.get("/api/cart", headers=headers).json() == {"items": [], "total": "0.00"}
    mine = client.get("/api/orders", headers=headers).json()
    assert [item["id"] for item in mine["items"]] == [order["id"]]

    admin = admin_headers()
    url = f"/api/admin/orders/{order['id']}"
    approved = client.patch(url, json={"status": "approved"}, headers=admin)
    assert approved.status_code == 200
    shipped = client.patch(
        url,
        json={"status": "shipped", "cargo_company": "Yurtiçi", "tracking_no": "YT-123"},
        headers=admin,
    )
    assert shipped.status_code == 200
    completed = client.patch(url, json={"status": "completed"}, headers=admin)
    assert completed.status_code == 200

    seen = client.get(f"/api/orders/{order['id']}", headers=headers).json()
    assert seen["status"] == "completed"
    assert seen["tracking_no"] == "YT-123"
    assert seen["cargo_company"] == "Yurtiçi"
    assert "admin_note" not in seen
    assert _stock(client, disk["id"]) == 8  # completing does not give stock back
    assert _stock(client, cable["id"]) == 2


def test_cancel_flow_restores_stock(client: TestClient, make_product) -> None:
    product = make_product(stock=5)
    headers = _register_and_login(client)
    order = _buy(client, headers, [(product["id"], 3)])
    assert _stock(client, product["id"]) == 2

    cancelled = client.post(f"/api/orders/{order['id']}/cancel", headers=headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert _stock(client, product["id"]) == 5

    again = client.post(f"/api/orders/{order['id']}/cancel", headers=headers)
    assert again.status_code == 409
    assert _stock(client, product["id"]) == 5


def test_rejected_order_restores_stock_once(
    client: TestClient, make_product, admin_headers
) -> None:
    product = make_product(stock=5)
    headers = _register_and_login(client)
    order = _buy(client, headers, [(product["id"], 4)])
    assert _stock(client, product["id"]) == 1

    admin = admin_headers()
    url = f"/api/admin/orders/{order['id']}"
    assert client.patch(url, json={"status": "rejected"}, headers=admin).status_code == 200
    assert _stock(client, product["id"]) == 5
    assert client.patch(url, json={"status": "rejected"}, headers=admin).status_code == 200
    assert _stock(client, product["id"]) == 5

    # A rejected order is final, and the customer can no longer cancel it.
    assert client.patch(url, json={"status": "approved"}, headers=admin).status_code == 409
    assert client.post(f"/api/orders/{order['id']}/cancel", headers=headers).status_code == 409
    assert _stock(client, product["id"]) == 5
