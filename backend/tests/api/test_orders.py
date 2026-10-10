"""Customer order endpoints: placing, listing, viewing and cancelling orders."""

SHIP = {
    "ship_name": "Jane Doe",
    "ship_phone": "+1 555 010 0100",
    "ship_address": "12 Example Street",
}


def _stock(conn, product_id: int) -> int:
    return conn.execute("SELECT stock FROM products WHERE id = %s", (product_id,)).fetchone()[
        "stock"
    ]


def _cart_rows(conn, user_id: int) -> int:
    return conn.execute(
        "SELECT count(*) AS n FROM cart_items WHERE user_id = %s", (user_id,)
    ).fetchone()["n"]


def _order_count(conn) -> int:
    return conn.execute("SELECT count(*) AS n FROM orders").fetchone()["n"]


def test_place_order_happy_path(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    first = make_product(price="100.00", stock=10, name="Disk")
    second = make_product(price="19.99", stock=5, name="Cable")
    make_cart_item(user["id"], first["id"], 2)
    make_cart_item(user["id"], second["id"], 3)

    response = client.post("/api/orders", json=SHIP, headers=auth_headers(user))

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "new"
    assert body["total"] == "259.97"
    assert body["item_count"] == 5
    assert body["ship_name"] == SHIP["ship_name"]
    assert [
        (i["product_name"], i["unit_price"], i["quantity"], i["line_total"]) for i in body["items"]
    ] == [
        ("Disk", "100.00", 2, "200.00"),
        ("Cable", "19.99", 3, "59.97"),
    ]
    assert _stock(conn, first["id"]) == 8
    assert _stock(conn, second["id"]) == 2
    assert _cart_rows(conn, user["id"]) == 0

    # The order keeps the name and price of the moment of purchase.
    conn.execute("UPDATE products SET price = 1, name = 'Renamed' WHERE id = %s", (first["id"],))
    detail = client.get(f"/api/orders/{body['id']}", headers=auth_headers(user)).json()
    assert detail["items"][0]["product_name"] == "Disk"
    assert detail["items"][0]["unit_price"] == "100.00"
    assert detail["total"] == "259.97"


def test_client_supplied_total_and_prices_are_ignored(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    product = make_product(price="50.00", stock=5)
    make_cart_item(user["id"], product["id"], 1)
    for extra in (
        {"total": "0.01"},
        {"items": [{"product_id": product["id"], "unit_price": "0.01"}]},
    ):
        response = client.post("/api/orders", json={**SHIP, **extra}, headers=auth_headers(user))
        assert response.status_code == 422
    assert _order_count(conn) == 0
    assert _stock(conn, product["id"]) == 5
    assert _cart_rows(conn, user["id"]) == 1


def test_empty_cart_gives_400(client, make_user, auth_headers) -> None:
    response = client.post("/api/orders", json=SHIP, headers=auth_headers(make_user()))
    assert response.status_code == 400
    assert response.json() == {"detail": "empty_cart"}


def test_second_submit_gets_empty_cart(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    product = make_product(stock=5)
    make_cart_item(user["id"], product["id"], 1)
    headers = auth_headers(user)
    assert client.post("/api/orders", json=SHIP, headers=headers).status_code == 201
    second = client.post("/api/orders", json=SHIP, headers=headers)
    assert second.status_code == 400
    assert second.json() == {"detail": "empty_cart"}
    assert _order_count(conn) == 1
    assert _stock(conn, product["id"]) == 4


def test_insufficient_stock_rolls_back_everything(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    fine = make_product(stock=10)
    short = make_product(stock=1)
    make_cart_item(user["id"], fine["id"], 2)
    make_cart_item(user["id"], short["id"], 2)

    response = client.post("/api/orders", json=SHIP, headers=auth_headers(user))

    assert response.status_code == 409
    assert response.json() == {"detail": "insufficient_stock", "product_id": short["id"]}
    assert _stock(conn, fine["id"]) == 10
    assert _stock(conn, short["id"]) == 1
    assert _order_count(conn) == 0
    assert _cart_rows(conn, user["id"]) == 2


def test_order_exact_stock_succeeds(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    product = make_product(stock=3)
    make_cart_item(user["id"], product["id"], 3)
    assert client.post("/api/orders", json=SHIP, headers=auth_headers(user)).status_code == 201
    assert _stock(conn, product["id"]) == 0


def test_order_with_inactive_product_conflicts(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    product = make_product(stock=5, is_active=False)
    make_cart_item(user["id"], product["id"], 1)
    response = client.post("/api/orders", json=SHIP, headers=auth_headers(user))
    assert response.status_code == 409
    assert response.json() == {"detail": "product_unavailable", "product_id": product["id"]}
    assert _order_count(conn) == 0
    assert _stock(conn, product["id"]) == 5


def test_list_and_detail_only_show_own_orders(
    client, make_user, make_product, make_order, auth_headers
) -> None:
    owner, other = make_user(), make_user()
    product = make_product()
    mine = make_order(owner["id"], items=((product["id"], 1),))
    make_order(owner["id"], items=((product["id"], 2),))

    listing = client.get("/api/orders", headers=auth_headers(owner)).json()
    assert listing["total"] == 2
    assert listing["page"] == 1
    assert listing["items"][0]["id"] > listing["items"][1]["id"]  # newest first
    assert set(listing["items"][0]) == {"id", "status", "total", "item_count", "created_at"}

    assert client.get(f"/api/orders/{mine['id']}", headers=auth_headers(owner)).status_code == 200
    assert client.get("/api/orders", headers=auth_headers(other)).json()["items"] == []
    stranger = client.get(f"/api/orders/{mine['id']}", headers=auth_headers(other))
    assert stranger.status_code == 404
    assert stranger.json() == {"detail": "not_found"}
    assert client.get("/api/orders/999999", headers=auth_headers(owner)).status_code == 404


def test_cancel_new_order_restores_stock(
    client, conn, make_user, make_product, make_cart_item, auth_headers
) -> None:
    user = make_user()
    product = make_product(stock=5)
    make_cart_item(user["id"], product["id"], 2)
    headers = auth_headers(user)
    order_id = client.post("/api/orders", json=SHIP, headers=headers).json()["id"]
    assert _stock(conn, product["id"]) == 3

    response = client.post(f"/api/orders/{order_id}/cancel", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert _stock(conn, product["id"]) == 5
    # Cancelling again is refused and must not add stock a second time.
    again = client.post(f"/api/orders/{order_id}/cancel", headers=headers)
    assert again.status_code == 409
    assert _stock(conn, product["id"]) == 5


def test_cancel_non_new_order_gives_409(
    client, make_user, make_product, make_order, auth_headers
) -> None:
    user = make_user()
    product = make_product()
    order = make_order(user["id"], status="approved", items=((product["id"], 1),))
    response = client.post(f"/api/orders/{order['id']}/cancel", headers=auth_headers(user))
    assert response.status_code == 409
    assert response.json() == {"detail": "invalid_status_transition"}


def test_cancel_someone_elses_order_gives_404(
    client, make_user, make_product, make_order, auth_headers
) -> None:
    owner, other = make_user(), make_user()
    order = make_order(owner["id"], items=((make_product()["id"], 1),))
    response = client.post(f"/api/orders/{order['id']}/cancel", headers=auth_headers(other))
    assert response.status_code == 404


def test_customer_never_sees_admin_note(
    client, conn, make_user, make_product, make_order, auth_headers
) -> None:
    user = make_user()
    order = make_order(user["id"], items=((make_product()["id"], 1),))
    conn.execute("UPDATE orders SET admin_note = 'internal only' WHERE id = %s", (order["id"],))
    headers = auth_headers(user)
    detail = client.get(f"/api/orders/{order['id']}", headers=headers)
    assert "admin_note" not in detail.json()
    assert "internal only" not in detail.text
    assert "internal only" not in client.get("/api/orders", headers=headers).text
