"""Favourite products: the customer's list, its ids, and adding and removing a favourite."""

from datetime import UTC, datetime

import psycopg
from fastapi.testclient import TestClient

# An id that no product has (the test database is truncated after every test).
MISSING_PRODUCT_ID = 999_999_999


def _favorite_url(product_id: int) -> str:
    return f"/api/me/favorites/{product_id}"


def _count_favorites(conn: psycopg.Connection) -> int:
    return conn.execute("SELECT count(*) AS n FROM favorites").fetchone()["n"]


def _favorite_on_day(conn: psycopg.Connection, make_favorite, user_id, product_id, day) -> None:
    """Favourite a product on a fixed October 2026 day, so the order ignores the clock."""
    make_favorite(user_id, product_id)
    conn.execute(
        "UPDATE favorites SET created_at = %s WHERE user_id = %s AND product_id = %s",
        (datetime(2026, 10, day, 10, tzinfo=UTC), user_id, product_id),
    )


def test_every_favourites_route_requires_login(client: TestClient) -> None:
    url = _favorite_url(MISSING_PRODUCT_ID)
    for method, path in (
        ("GET", "/api/me/favorites"),
        ("GET", "/api/me/favorites/ids"),
        ("PUT", url),
        ("DELETE", url),
    ):
        response = client.request(method, path)
        assert response.status_code == 401, f"{method} {path}"
        assert response.json() == {"detail": "unauthorized"}


def test_put_adds_a_favourite_and_repeating_it_keeps_one_row(
    client: TestClient, conn: psycopg.Connection, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    product = make_product()
    first = client.put(_favorite_url(product["id"]), headers=headers)
    assert first.status_code == 204
    assert first.content == b""
    assert client.put(_favorite_url(product["id"]), headers=headers).status_code == 204
    assert _count_favorites(conn) == 1
    assert client.get("/api/me/favorites/ids", headers=headers).json() == {"ids": [product["id"]]}


def test_put_of_missing_or_inactive_product_gives_404(
    client: TestClient, conn: psycopg.Connection, make_user, make_product, auth_headers
) -> None:
    headers = auth_headers(make_user())
    product = make_product()
    inactive = make_product(is_active=False)
    # A valid PUT of an active product succeeds, so the 404s below are not a missing route.
    assert client.put(_favorite_url(product["id"]), headers=headers).status_code == 204
    for product_id in (inactive["id"], MISSING_PRODUCT_ID):
        response = client.put(_favorite_url(product_id), headers=headers)
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}
    assert _count_favorites(conn) == 1


def test_delete_removes_a_favourite_and_repeating_it_is_still_204(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_favorite,
    auth_headers,
) -> None:
    user = make_user()
    product = make_product()
    make_favorite(user["id"], product["id"])
    headers = auth_headers(user)
    url = _favorite_url(product["id"])
    assert client.delete(url, headers=headers).status_code == 204
    assert _count_favorites(conn) == 0
    assert client.delete(url, headers=headers).status_code == 204


def test_newest_favourite_first_in_ids_and_paged_list(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_favorite,
    auth_headers,
) -> None:
    user = make_user()
    headers = auth_headers(user)
    oldest, middle, newest = make_product(), make_product(), make_product()
    for product, day in ((oldest, 1), (middle, 2), (newest, 3)):
        _favorite_on_day(conn, make_favorite, user["id"], product["id"], day)
    newest_first = [newest["id"], middle["id"], oldest["id"]]
    assert client.get("/api/me/favorites/ids", headers=headers).json() == {"ids": newest_first}

    first = client.get("/api/me/favorites", params={"page_size": 2}, headers=headers).json()
    assert (first["total"], first["page"], first["page_size"]) == (3, 1, 2)
    assert [item["id"] for item in first["items"]] == newest_first[:2]
    second = client.get(
        "/api/me/favorites", params={"page": 2, "page_size": 2}, headers=headers
    ).json()
    assert [item["id"] for item in second["items"]] == newest_first[2:]


def test_deactivated_product_leaves_the_favourites_and_returns_when_active_again(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_favorite,
    auth_headers,
) -> None:
    user = make_user()
    headers = auth_headers(user)
    product = make_product()
    make_favorite(user["id"], product["id"])
    conn.execute("UPDATE products SET is_active = FALSE WHERE id = %s", (product["id"],))
    assert client.get("/api/me/favorites/ids", headers=headers).json() == {"ids": []}
    listed = client.get("/api/me/favorites", headers=headers).json()
    assert (listed["total"], listed["items"]) == (0, [])
    # The favourite row itself is kept, so the product comes back with it.
    assert _count_favorites(conn) == 1
    conn.execute("UPDATE products SET is_active = TRUE WHERE id = %s", (product["id"],))
    assert client.get("/api/me/favorites/ids", headers=headers).json() == {"ids": [product["id"]]}
    assert client.get("/api/me/favorites", headers=headers).json()["total"] == 1


def test_other_users_favourites_are_invisible(
    client: TestClient, make_user, make_product, make_favorite, auth_headers
) -> None:
    me = make_user()
    other = make_user()
    product = make_product()
    make_favorite(other["id"], product["id"])
    headers = auth_headers(me)
    assert client.get("/api/me/favorites/ids", headers=headers).json() == {"ids": []}
    assert client.get("/api/me/favorites", headers=headers).json()["total"] == 0
    # Removing a favourite only touches the caller's own row.
    assert client.delete(_favorite_url(product["id"]), headers=headers).status_code == 204
    other_ids = client.get("/api/me/favorites/ids", headers=auth_headers(other))
    assert other_ids.json() == {"ids": [product["id"]]}


def test_list_items_have_the_same_fields_as_the_product_list(
    client: TestClient, make_user, make_product, make_favorite, auth_headers
) -> None:
    user = make_user()
    product = make_product(name="Running Shoe")
    make_favorite(user["id"], product["id"])
    favorite = client.get("/api/me/favorites", headers=auth_headers(user)).json()["items"][0]
    catalogue = client.get("/api/products").json()["items"][0]
    assert favorite == catalogue


def test_deleting_a_product_removes_its_favourites(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_favorite,
    auth_headers,
) -> None:
    user = make_user()
    product = make_product()
    make_favorite(user["id"], product["id"])
    conn.execute("DELETE FROM products WHERE id = %s", (product["id"],))
    assert _count_favorites(conn) == 0
    assert client.get("/api/me/favorites/ids", headers=auth_headers(user)).json() == {"ids": []}


def test_ids_hold_at_most_the_newest_1000_favourites(
    client: TestClient, conn: psycopg.Connection, make_user, auth_headers
) -> None:
    user = make_user()
    conn.execute(
        "INSERT INTO products (sku, name, price, stock) "
        "SELECT 'SKU-' || n, 'Product ' || n, 1, 1 FROM generate_series(1, 1001) AS n"
    )
    # The favourite dates rise with the product ids, so the first product is the oldest favourite.
    conn.execute(
        "INSERT INTO favorites (user_id, product_id, created_at) "
        "SELECT %s, id, timestamptz '2026-10-01' + id * interval '1 second' FROM products",
        (user["id"],),
    )
    oldest = conn.execute("SELECT min(id) AS id FROM products").fetchone()["id"]
    ids = client.get("/api/me/favorites/ids", headers=auth_headers(user)).json()["ids"]
    assert len(ids) == 1000
    assert oldest not in ids
