"""Categories and brands: public lists, admin CRUD, duplicate names and dependencies."""

import pytest
from fastapi.testclient import TestClient


def _create(client: TestClient, headers: dict[str, str], path: str, name: str) -> dict:
    response = client.post(f"/api/admin/{path}", json={"name": name}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_public_lists_are_sorted_by_name_for_categories_and_brands(
    client: TestClient, make_category, make_brand
) -> None:
    for name in ("Shoes", "Bags", "Hats"):
        make_category(name)
    for name in ("Nike", "Adidas", "Puma"):
        make_brand(name)

    categories = client.get("/api/categories")
    assert categories.status_code == 200
    assert [row["name"] for row in categories.json()] == ["Bags", "Hats", "Shoes"]
    assert set(categories.json()[0]) == {"id", "name", "description"}

    brands = client.get("/api/brands")
    assert brands.status_code == 200
    assert [row["name"] for row in brands.json()] == ["Adidas", "Nike", "Puma"]


@pytest.mark.parametrize("path", ["categories", "brands"])
def test_admin_crud_for_categories_and_brands(client: TestClient, admin_headers, path: str) -> None:
    headers = admin_headers()

    created = client.post(f"/api/admin/{path}", json={"name": "Outdoor"}, headers=headers)
    assert created.status_code == 201
    item = created.json()
    assert (item["name"], item["description"]) == ("Outdoor", "")

    updated = client.put(
        f"/api/admin/{path}/{item['id']}",
        json={"name": "Camping", "description": "Tents and stoves"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json() == {
        "id": item["id"],
        "name": "Camping",
        "description": "Tents and stoves",
    }
    assert client.get(f"/api/admin/{path}", headers=headers).json() == [updated.json()]

    deleted = client.delete(f"/api/admin/{path}/{item['id']}", headers=headers)
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert client.get(f"/api/{path}").json() == []


@pytest.mark.parametrize("path", ["categories", "brands"])
def test_duplicate_name_gives_409_name_taken(client: TestClient, admin_headers, path: str) -> None:
    headers = admin_headers()
    first = _create(client, headers, path, "Shoes")
    second = _create(client, headers, path, "Bags")

    duplicate = client.post(f"/api/admin/{path}", json={"name": "Shoes"}, headers=headers)
    assert duplicate.status_code == 409
    assert duplicate.json() == {"detail": "name_taken"}

    renamed = client.put(
        f"/api/admin/{path}/{second['id']}", json={"name": "Shoes"}, headers=headers
    )
    assert renamed.status_code == 409
    assert renamed.json() == {"detail": "name_taken"}

    # Saving an item under its own name is not a duplicate.
    kept = client.put(
        f"/api/admin/{path}/{first['id']}",
        json={"name": "Shoes", "description": "Footwear"},
        headers=headers,
    )
    assert kept.status_code == 200


def test_delete_with_products_gives_409_has_dependencies(
    client: TestClient, admin_headers, conn, make_category, make_brand, make_product
) -> None:
    headers = admin_headers()
    category = make_category()
    brand = make_brand()
    product = make_product(category_id=category["id"], brand_id=brand["id"])

    for path, item in (("categories", category), ("brands", brand)):
        blocked = client.delete(f"/api/admin/{path}/{item['id']}", headers=headers)
        assert blocked.status_code == 409
        assert blocked.json() == {"detail": "has_dependencies"}
    assert [row["id"] for row in client.get("/api/categories").json()] == [category["id"]]

    # Once the product is gone, both deletes go through.
    conn.execute("DELETE FROM products WHERE id = %s", (product["id"],))
    for path, item in (("categories", category), ("brands", brand)):
        deleted = client.delete(f"/api/admin/{path}/{item['id']}", headers=headers)
        assert deleted.status_code == 204


def test_restrict_violation_still_gives_409_has_dependencies(
    client: TestClient, admin_headers, make_category, make_product, monkeypatch
) -> None:
    headers = admin_headers()
    category = make_category()
    make_product(category_id=category["id"])
    # Simulate a product added after the pre-check: the database RESTRICT must still answer 409.
    monkeypatch.setattr("app.repositories.taxonomy.has_products", lambda conn, kind, item_id: None)

    response = client.delete(f"/api/admin/categories/{category['id']}", headers=headers)
    assert response.status_code == 409
    assert response.json() == {"detail": "has_dependencies"}


@pytest.mark.parametrize("path", ["categories", "brands"])
def test_unknown_id_gives_404(client: TestClient, admin_headers, path: str) -> None:
    headers = admin_headers()
    # A row that was deleted is just as unknown as one that never existed. Creating and
    # deleting it first proves the routes work, so the 404 comes from the lookup itself.
    gone = _create(client, headers, path, "Gone")
    removed = client.delete(f"/api/admin/{path}/{gone['id']}", headers=headers)
    assert removed.status_code == 204

    updated = client.put(f"/api/admin/{path}/{gone['id']}", json={"name": "Ghost"}, headers=headers)
    assert updated.status_code == 404
    assert updated.json() == {"detail": "not_found"}
    deleted = client.delete(f"/api/admin/{path}/{gone['id']}", headers=headers)
    assert deleted.status_code == 404
    assert deleted.json() == {"detail": "not_found"}


@pytest.mark.parametrize("path", ["categories", "brands"])
def test_taxonomy_admin_routes_require_admin(
    client: TestClient, make_user, auth_headers, path: str
) -> None:
    customer = auth_headers(make_user())
    routes = (
        ("GET", f"/api/admin/{path}", None),
        ("POST", f"/api/admin/{path}", {"name": "Shoes"}),
        ("PUT", f"/api/admin/{path}/1", {"name": "Shoes"}),
        ("DELETE", f"/api/admin/{path}/1", None),
    )
    for method, url, body in routes:
        anonymous = client.request(method, url, json=body)
        assert anonymous.status_code == 401, url
        assert anonymous.json() == {"detail": "unauthorized"}, url
        forbidden = client.request(method, url, json=body, headers=customer)
        assert forbidden.status_code == 403, url
        assert forbidden.json() == {"detail": "forbidden"}, url
