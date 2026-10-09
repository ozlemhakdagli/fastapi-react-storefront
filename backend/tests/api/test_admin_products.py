"""Admin product management: admin-only access, CRUD and reference rules (see docs/api.md)."""

from fastapi.testclient import TestClient

from app.repositories import products


def _payload(**overrides) -> dict:
    body = {"sku": "NEW-1", "name": "New product", "price": "120.50", "stock": 5}
    body.update(overrides)
    return body


def test_admin_products_require_admin(
    client: TestClient, make_user, make_product, auth_headers
) -> None:
    product = make_product()
    product_path = f"/api/admin/products/{product['id']}"
    image_path = f"{product_path}/images"
    customer = auth_headers(make_user())
    calls = [
        ("GET", "/api/admin/products", {}),
        ("POST", "/api/admin/products", {"json": _payload()}),
        ("GET", product_path, {}),
        ("PUT", product_path, {"json": _payload()}),
        ("DELETE", product_path, {}),
        ("POST", image_path, {"files": {"file": ("a.png", b"x", "image/png")}}),
        ("PUT", f"{product_path}/images/order", {"json": {"image_ids": []}}),
        ("DELETE", f"{image_path}/1", {}),
    ]
    for method, path, kwargs in calls:
        assert client.request(method, path, **kwargs).status_code == 401, (method, path)
        response = client.request(method, path, headers=customer, **kwargs)
        assert response.status_code == 403, (method, path)
        assert response.json() == {"detail": "forbidden"}


def test_admin_product_images_carry_the_card_url(
    client: TestClient, admin_headers, make_product, make_image
) -> None:
    headers = admin_headers()
    product = make_product()
    make_image(product["id"], file_name="photo.webp", thumb_name="photo-sm.webp", position=0)
    body = client.get(f"/api/admin/products/{product['id']}", headers=headers).json()
    assert body["image_url"] == "/api/media/photo-sm.webp"
    [image] = body["images"]
    assert (image["url"], image["thumb_url"]) == (
        "/api/media/photo.webp",
        "/api/media/photo-sm.webp",
    )


def test_admin_list_includes_inactive_and_cost_price(
    client: TestClient, admin_headers, make_product
) -> None:
    active = make_product(cost_price="60.00")
    inactive = make_product(is_active=False)
    body = client.get("/api/admin/products", headers=admin_headers()).json()
    assert body["total"] == 2
    by_id = {item["id"]: item for item in body["items"]}
    assert by_id[active["id"]]["cost_price"] == "60.00"
    assert by_id[active["id"]]["is_active"] is True
    assert by_id[inactive["id"]]["is_active"] is False
    assert by_id[inactive["id"]]["cost_price"] is None


def test_create_get_update_delete(
    client: TestClient, admin_headers, make_brand, make_category
) -> None:
    headers = admin_headers()
    brand = make_brand()
    category = make_category()
    created = client.post(
        "/api/admin/products",
        headers=headers,
        json=_payload(
            sku="CRUD-1", brand_id=brand["id"], category_id=category["id"], cost_price="60.00"
        ),
    )
    assert created.status_code == 201
    product = created.json()
    product_id = product["id"]
    assert product["sku"] == "CRUD-1"
    assert product["price"] == "120.50"
    assert product["cost_price"] == "60.00"
    assert product["brand"] == {"id": brand["id"], "name": brand["name"]}
    assert product["category"] == {"id": category["id"], "name": category["name"]}
    assert product["image_url"] == "/api/media/placeholder.svg"
    assert product["is_active"] is True

    fetched = client.get(f"/api/admin/products/{product_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["sku"] == "CRUD-1"

    replaced = client.put(
        f"/api/admin/products/{product_id}",
        headers=headers,
        json=_payload(
            sku="CRUD-2",
            name="Renamed",
            short_description="Short",
            description="Long text",
            price="99.00",
            stock=7,
            is_new=True,
            is_active=False,
        ),
    )
    assert replaced.status_code == 200
    body = replaced.json()
    assert body["sku"] == "CRUD-2"
    assert body["name"] == "Renamed"
    assert body["short_description"] == "Short"
    assert body["description"] == "Long text"
    assert body["price"] == "99.00"
    assert body["cost_price"] is None  # a full replace clears fields that the body omits
    assert body["stock"] == 7
    assert body["is_new"] is True
    assert body["is_active"] is False
    assert body["brand"] is None
    assert body["category"] is None
    assert body["updated_at"] != product["updated_at"]

    deleted = client.delete(f"/api/admin/products/{product_id}", headers=headers)
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert client.get(f"/api/admin/products/{product_id}", headers=headers).status_code == 404


def test_missing_product_gives_404_for_update_and_delete(client: TestClient, admin_headers) -> None:
    headers = admin_headers()
    put = client.put("/api/admin/products/999999", headers=headers, json=_payload())
    assert put.status_code == 404
    assert put.json() == {"detail": "not_found"}
    delete = client.delete("/api/admin/products/999999", headers=headers)
    assert delete.status_code == 404
    assert delete.json() == {"detail": "not_found"}


def test_create_duplicate_sku_409(client: TestClient, admin_headers, make_product) -> None:
    make_product(sku="TAKEN-1")
    response = client.post(
        "/api/admin/products", headers=admin_headers(), json=_payload(sku="TAKEN-1")
    )
    assert response.status_code == 409
    assert response.json() == {"detail": "sku_taken"}


def test_update_to_taken_sku_409(client: TestClient, admin_headers, make_product) -> None:
    headers = admin_headers()
    make_product(sku="TAKEN-2")
    mine = make_product(sku="MINE-2")
    path = f"/api/admin/products/{mine['id']}"
    response = client.put(path, headers=headers, json=_payload(sku="TAKEN-2"))
    assert response.status_code == 409
    assert response.json() == {"detail": "sku_taken"}
    # Keeping one's own SKU is not a conflict.
    assert client.put(path, headers=headers, json=_payload(sku="MINE-2")).status_code == 200


def test_unknown_brand_or_category_gives_422_invalid_reference(
    client: TestClient, admin_headers, make_product
) -> None:
    headers = admin_headers()
    product = make_product()
    path = f"/api/admin/products/{product['id']}"
    for field in ("brand_id", "category_id"):
        created = client.post(
            "/api/admin/products", headers=headers, json=_payload(**{field: 999999})
        )
        assert created.status_code == 422
        assert created.json() == {"detail": "invalid_reference", "field": field}
        replaced = client.put(path, headers=headers, json=_payload(**{field: 999999}))
        assert replaced.status_code == 422
        assert replaced.json() == {"detail": "invalid_reference", "field": field}
    # An id too large for a bigint is simply unknown, not a server error.
    huge = client.post("/api/admin/products", headers=headers, json=_payload(brand_id=10**30))
    assert huge.status_code == 422
    assert huge.json() == {"detail": "invalid_reference", "field": "brand_id"}


def test_delete_product_in_an_order_gives_409_has_dependencies(
    client: TestClient, admin_headers, make_user, make_product, make_order
) -> None:
    headers = admin_headers()
    product = make_product()
    make_order(make_user()["id"], items=((product["id"], 1),))
    response = client.delete(f"/api/admin/products/{product['id']}", headers=headers)
    assert response.status_code == 409
    assert response.json() == {"detail": "has_dependencies"}
    assert client.get(f"/api/admin/products/{product['id']}", headers=headers).status_code == 200


def test_delete_refused_by_the_database_gives_409_has_dependencies(
    client: TestClient, admin_headers, make_user, make_product, make_order, monkeypatch
) -> None:
    # The order line is added after the has_orders check, so only RESTRICT stops the delete.
    product = make_product()
    make_order(make_user()["id"], items=((product["id"], 1),))
    monkeypatch.setattr(products, "has_orders", lambda conn, product_id: False)
    response = client.delete(f"/api/admin/products/{product['id']}", headers=admin_headers())
    assert response.status_code == 409
    assert response.json() == {"detail": "has_dependencies"}


def test_reference_deleted_after_the_check_gives_422_invalid_reference(
    client: TestClient, admin_headers, monkeypatch
) -> None:
    # The brand vanishes between the reference check and the insert, so the foreign key refuses it.
    monkeypatch.setattr(products, "missing_reference", lambda conn, brand_id, category_id: None)
    response = client.post(
        "/api/admin/products", headers=admin_headers(), json=_payload(brand_id=999999)
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "invalid_reference", "field": "brand_id"}


def _put_body(product: dict, **overrides) -> dict:
    body = {
        "sku": product["sku"],
        "name": product["name"],
        "price": str(product["price"]),
        "stock": product["stock"],
    }
    body.update(overrides)
    return body


def test_a_stale_edit_form_cannot_overwrite_stock_sold_in_the_meantime(
    client: TestClient, conn, admin_headers, make_product
) -> None:
    """Saving a form that was opened before a sale must not undo the sale."""
    headers = admin_headers()
    product = make_product(stock=10)
    url = f"/api/admin/products/{product['id']}"
    opened = client.get(url, headers=headers).json()  # the admin opens the edit form

    conn.execute(  # a customer buys 3 meanwhile
        "UPDATE products SET stock = stock - 3, updated_at = now() WHERE id = %s", (product["id"],)
    )
    stale = client.put(
        url,
        json=_put_body(product, name="Renamed", expected_updated_at=opened["updated_at"]),
        headers=headers,
    )

    assert stale.status_code == 409
    assert stale.json() == {"detail": "product_changed"}
    row = conn.execute("SELECT name, stock FROM products WHERE id = %s", (product["id"],))
    assert row.fetchone() == {"name": product["name"], "stock": 7}


def test_an_edit_with_the_current_version_succeeds_and_moves_the_version_on(
    client: TestClient, admin_headers, make_product
) -> None:
    headers = admin_headers()
    product = make_product(stock=10)
    url = f"/api/admin/products/{product['id']}"
    opened = client.get(url, headers=headers).json()

    first = client.put(
        url,
        json=_put_body(product, name="First", expected_updated_at=opened["updated_at"]),
        headers=headers,
    )
    assert first.status_code == 200
    assert first.json()["updated_at"] != opened["updated_at"]
    # The same, now outdated, version is refused; the new one is accepted.
    again = client.put(
        url,
        json=_put_body(product, name="Second", expected_updated_at=opened["updated_at"]),
        headers=headers,
    )
    assert again.status_code == 409
    follow_up = client.put(
        url,
        json=_put_body(product, name="Second", expected_updated_at=first.json()["updated_at"]),
        headers=headers,
    )
    assert follow_up.status_code == 200
    assert follow_up.json()["name"] == "Second"


def test_the_version_is_optional_and_an_unknown_product_is_still_404(
    client: TestClient, admin_headers, make_product
) -> None:
    headers = admin_headers()
    product = make_product(stock=10)
    ok = client.put(
        f"/api/admin/products/{product['id']}", json=_put_body(product, stock=4), headers=headers
    )
    assert ok.status_code == 200
    assert ok.json()["stock"] == 4
    missing = client.put(
        "/api/admin/products/999999",
        json=_put_body(product, expected_updated_at="2026-01-01T00:00:00Z"),
        headers=headers,
    )
    assert missing.status_code == 404


def test_creating_a_product_does_not_accept_an_update_version(
    client: TestClient, admin_headers
) -> None:
    """expected_updated_at belongs to updates only; a create refuses it instead of ignoring it."""
    body = _payload(sku="VER-1", expected_updated_at="2026-01-01T00:00:00Z")
    response = client.post("/api/admin/products", json=body, headers=admin_headers())
    assert response.status_code == 422
