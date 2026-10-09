"""Cart API: the logged-in customer's lines, stock limits, 404 and 409 rules, and totals."""

from fastapi.testclient import TestClient


def _post(client: TestClient, headers: dict[str, str], product_id: int, quantity: int | str):
    return client.post(
        "/api/cart/items",
        json={"product_id": product_id, "quantity": quantity},
        headers=headers,
    )


def _put(client: TestClient, headers: dict[str, str], product_id: int, quantity: int | str):
    return client.put(f"/api/cart/items/{product_id}", json={"quantity": quantity}, headers=headers)


def test_cart_requires_login(client: TestClient, make_product) -> None:
    product_id = make_product()["id"]
    responses = [
        client.get("/api/cart"),
        client.post("/api/cart/items", json={"product_id": product_id, "quantity": 1}),
        client.put(f"/api/cart/items/{product_id}", json={"quantity": 1}),
        client.delete(f"/api/cart/items/{product_id}"),
    ]
    for response in responses:
        assert response.status_code == 401
        assert response.json() == {"detail": "unauthorized"}


def test_empty_cart(client: TestClient, make_user, auth_headers) -> None:
    response = client.get("/api/cart", headers=auth_headers(make_user()))
    assert response.status_code == 200
    assert response.json() == {"items": [], "total": "0.00"}


def test_add_creates_then_increments_the_same_row(
    client: TestClient, conn, make_user, make_product, auth_headers
) -> None:
    user = make_user()
    headers = auth_headers(user)
    product = make_product(stock=10)
    assert _post(client, headers, product["id"], 1).status_code == 200
    response = _post(client, headers, product["id"], 2)
    assert response.status_code == 200
    assert [item["quantity"] for item in response.json()["items"]] == [3]
    rows = conn.execute(
        "SELECT quantity FROM cart_items WHERE user_id = %s", (user["id"],)
    ).fetchall()
    assert [row["quantity"] for row in rows] == [3]


def test_add_beyond_stock_gives_409_with_product_id(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    product = make_product(stock=2)
    response = _post(client, headers, product["id"], 3)
    assert response.status_code == 409
    assert response.json() == {"detail": "insufficient_stock", "product_id": product["id"]}
    # The limit applies to the quantity the cart would hold, so earlier adds count too.
    assert _post(client, headers, product["id"], 2).status_code == 200
    response = _post(client, headers, product["id"], 1)
    assert response.status_code == 409
    assert response.json() == {"detail": "insufficient_stock", "product_id": product["id"]}


def test_stock_exactly_equal_to_quantity_is_allowed(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    product = make_product(stock=3)
    response = _post(client, headers, product["id"], 3)
    assert response.status_code == 200
    assert [item["quantity"] for item in response.json()["items"]] == [3]


def test_quantity_bounds(client: TestClient, make_user, make_product, auth_headers) -> None:
    headers = auth_headers(make_user())
    product = make_product(stock=100)
    for quantity in (0, 100, -1, "x"):
        assert _post(client, headers, product["id"], quantity).status_code == 422, quantity
        assert _put(client, headers, product["id"], quantity).status_code == 422, quantity
    # The boundaries 1 and 99 are valid.
    assert _post(client, headers, product["id"], 1).status_code == 200
    assert _put(client, headers, product["id"], 99).status_code == 200


def test_put_sets_absolute_quantity(
    client: TestClient, conn, make_user, make_product, auth_headers
) -> None:
    user = make_user()
    headers = auth_headers(user)
    product = make_product(stock=10)
    _post(client, headers, product["id"], 5)
    response = _put(client, headers, product["id"], 2)
    assert response.status_code == 200
    assert [item["quantity"] for item in response.json()["items"]] == [2]
    rows = conn.execute(
        "SELECT quantity FROM cart_items WHERE user_id = %s", (user["id"],)
    ).fetchall()
    assert [row["quantity"] for row in rows] == [2]


def test_add_inactive_or_missing_product_gives_404(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    # The same calls succeed for an active product, so the 404s below come from the rule.
    active = make_product(stock=10)
    assert _post(client, headers, active["id"], 1).status_code == 200
    assert _put(client, headers, active["id"], 1).status_code == 200
    inactive = make_product(is_active=False)
    for product_id in (inactive["id"], 999_999):
        response = _post(client, headers, product_id, 1)
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}
        response = _put(client, headers, product_id, 1)
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}


def test_delete_is_idempotent(client: TestClient, make_user, make_product, auth_headers) -> None:
    headers = auth_headers(make_user())
    product = make_product(stock=10)
    _post(client, headers, product["id"], 1)
    for product_id in (product["id"], product["id"], 999_999):
        response = client.delete(f"/api/cart/items/{product_id}", headers=headers)
        assert response.status_code == 200
        assert response.json() == {"items": [], "total": "0.00"}


def test_carts_are_isolated_between_users(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    alice = auth_headers(make_user())
    bob = auth_headers(make_user())
    product = make_product(stock=10)
    _post(client, alice, product["id"], 2)
    assert client.get("/api/cart", headers=bob).json() == {"items": [], "total": "0.00"}
    assert client.delete(f"/api/cart/items/{product['id']}", headers=bob).status_code == 200
    alice_items = client.get("/api/cart", headers=alice).json()["items"]
    assert [item["quantity"] for item in alice_items] == [2]


def test_total_uses_decimal_math(client: TestClient, make_user, make_product, auth_headers) -> None:
    headers = auth_headers(make_user())
    product = make_product(price="19.99", stock=10)
    response = _post(client, headers, product["id"], 3)
    assert response.status_code == 200
    body = response.json()
    assert body["items"][0]["unit_price"] == "19.99"
    assert body["items"][0]["line_total"] == "59.97"
    assert body["total"] == "59.97"


def test_line_for_deactivated_product_is_still_listed(
    client: TestClient, conn, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    product = make_product(name="Discontinued lamp", price="100.00", stock=10)
    _post(client, headers, product["id"], 1)
    conn.execute("UPDATE products SET is_active = false WHERE id = %s", (product["id"],))
    response = client.get("/api/cart", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert [item["product_id"] for item in body["items"]] == [product["id"]]
    assert body["items"][0]["name"] == "Discontinued lamp"
    assert body["total"] == body["items"][0]["line_total"]
    assert body["items"][0]["available"] is False


def test_lines_of_active_products_are_available(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    product = make_product()
    response = _post(client, headers, product["id"], 1)
    assert response.json()["items"][0]["available"] is True


def test_lines_are_ordered_by_product_id(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    first = make_product(stock=5)
    second = make_product(stock=5)
    _post(client, headers, second["id"], 1)  # added first, but it has the higher id
    _post(client, headers, first["id"], 1)
    items = client.get("/api/cart", headers=headers).json()["items"]
    assert [item["product_id"] for item in items] == [first["id"], second["id"]]


def test_line_image_is_the_first_image_or_the_placeholder(
    client: TestClient, make_user, make_product, make_image, auth_headers
) -> None:
    headers = auth_headers(make_user())
    with_images = make_product(stock=5)
    make_image(with_images["id"], file_name="second.jpg", position=1)
    make_image(with_images["id"], file_name="first.jpg", position=0)
    without_images = make_product(stock=5)
    _post(client, headers, with_images["id"], 1)
    _post(client, headers, without_images["id"], 1)
    items = client.get("/api/cart", headers=headers).json()["items"]
    images = {item["product_id"]: item["image_url"] for item in items}
    assert images == {
        with_images["id"]: "/api/media/first.jpg",
        without_images["id"]: "/api/media/placeholder.svg",
    }


def test_a_stale_stock_check_that_overshoots_the_line_limit_is_a_409_not_a_500(
    client: TestClient, make_user, make_product, make_cart_item, auth_headers, monkeypatch
) -> None:
    """Two concurrent adds can both pass the check; the database CHECK must not become a 500."""
    from app.repositories import cart as cart_repo

    user = make_user()
    product = make_product(stock=500)
    make_cart_item(user["id"], product["id"], 98)
    real = cart_repo.product_for_cart
    monkeypatch.setattr(
        cart_repo, "product_for_cart", lambda *args: {**real(*args), "cart_quantity": 0}
    )

    response = _post(client, auth_headers(user), product["id"], 5)  # 98 + 5 breaks BETWEEN 1 AND 99

    assert response.status_code == 409
    assert response.json() == {"detail": "insufficient_stock", "product_id": product["id"]}
