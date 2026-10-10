"""Star ratings: only buyers rate, the average and count of products, and the stars on comments."""

import psycopg
from fastapi.testclient import TestClient

from app.repositories import ratings

# An id that no product has (the test database is truncated after every test).
MISSING_PRODUCT_ID = 999_999_999


def _url(product_id: int) -> str:
    return f"/api/me/ratings/{product_id}"


def _rows(conn: psycopg.Connection, product_id: int) -> list[dict]:
    return conn.execute(
        "SELECT user_id, rating FROM product_ratings WHERE product_id = %s ORDER BY user_id",
        (product_id,),
    ).fetchall()


def _shown(client: TestClient, product_id: int) -> tuple[float | None, int]:
    """The average and count that the product detail and the catalogue list show."""
    detail = client.get(f"/api/products/{product_id}").json()
    listed = next(
        item for item in client.get("/api/products").json()["items"] if item["id"] == product_id
    )
    assert (listed["rating_avg"], listed["rating_count"]) == (
        detail["rating_avg"],
        detail["rating_count"],
    )
    return detail["rating_avg"], detail["rating_count"]


def test_put_is_refused_without_a_completed_order_of_this_product(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_order,
    auth_headers,
) -> None:
    buyer = make_user()
    stranger = make_user()
    product = make_product()
    other_product = make_product()
    headers = auth_headers(buyer)
    url = _url(product["id"])

    def refused() -> None:
        response = client.put(url, json={"rating": 5}, headers=headers)
        assert response.status_code == 403
        assert response.json() == {"detail": "purchase_required"}

    refused()  # no order at all
    for status in ("new", "approved", "shipped", "rejected", "cancelled"):
        make_order(buyer["id"], status=status, items=((product["id"], 1),))
        refused()
    make_order(stranger["id"], status="completed", items=((product["id"], 1),))
    refused()  # a completed order of another customer
    make_order(buyer["id"], status="completed", items=((other_product["id"], 1),))
    refused()  # a completed order of the buyer, but for another product
    assert _rows(conn, product["id"]) == []


def test_completed_order_allows_rating_and_a_second_put_replaces_the_row(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_order,
    auth_headers,
) -> None:
    buyer = make_user()
    product = make_product()
    make_order(buyer["id"], status="completed", items=((product["id"], 2),))
    headers = auth_headers(buyer)
    url = _url(product["id"])
    for rating in (1, 5):
        response = client.put(url, json={"rating": rating}, headers=headers)
        assert response.status_code == 200
        assert response.json() == {"rating": rating, "can_rate": True}
    assert _rows(conn, product["id"]) == [{"user_id": buyer["id"], "rating": 5}]


def test_invalid_ratings_are_422_before_the_purchase_check(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    auth_headers,
) -> None:
    # The customer has no order, so only the body validation can answer 422 here.
    customer = make_user()
    product = make_product()
    url = _url(product["id"])
    bodies = (
        {"rating": 0},
        {"rating": 6},
        {"rating": 4.5},
        {"rating": "5"},
        {"rating": True},
        {"rating": None},
        {"rating": 5, "stars": 5},
        {},
    )
    for body in bodies:
        response = client.put(url, json=body, headers=auth_headers(customer))
        assert response.status_code == 422, body
    assert _rows(conn, product["id"]) == []


def test_get_shows_the_rating_and_whether_the_caller_can_rate(
    client: TestClient,
    make_user,
    make_product,
    make_order,
    auth_headers,
) -> None:
    buyer = make_user()
    product = make_product()
    headers = auth_headers(buyer)
    url = _url(product["id"])
    assert client.get(url, headers=headers).json() == {"rating": None, "can_rate": False}
    make_order(buyer["id"], status="completed", items=((product["id"], 1),))
    assert client.get(url, headers=headers).json() == {"rating": None, "can_rate": True}
    assert client.put(url, json={"rating": 3}, headers=headers).status_code == 200
    assert client.get(url, headers=headers).json() == {"rating": 3, "can_rate": True}


def test_missing_or_inactive_product_gives_404(
    client: TestClient,
    make_user,
    make_product,
    make_order,
    auth_headers,
) -> None:
    buyer = make_user()
    headers = auth_headers(buyer)
    active = make_product()
    inactive = make_product(is_active=False)
    # Even a completed order does not make an inactive product ratable.
    make_order(buyer["id"], status="completed", items=((inactive["id"], 1),))
    # The active product answers 200, so the 404s below cannot come from a missing route.
    assert client.get(_url(active["id"]), headers=headers).status_code == 200
    for product_id in (inactive["id"], MISSING_PRODUCT_ID):
        url = _url(product_id)
        for response in (
            client.get(url, headers=headers),
            client.put(url, json={"rating": 5}, headers=headers),
        ):
            assert response.status_code == 404
            assert response.json() == {"detail": "not_found"}


def test_delete_needs_no_purchase_and_is_idempotent(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_rating,
    auth_headers,
) -> None:
    buyer = make_user()
    product = make_product()
    make_rating(buyer["id"], product["id"], 4)
    headers = auth_headers(buyer)
    url = _url(product["id"])
    assert client.delete(url, headers=headers).status_code == 204
    assert _rows(conn, product["id"]) == []
    assert client.delete(url, headers=headers).status_code == 204


def test_only_the_author_reads_and_changes_a_rating(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_rating,
    make_order,
    auth_headers,
) -> None:
    author = make_user()
    other = make_user()
    product = make_product()
    make_rating(author["id"], product["id"], 5)
    url = _url(product["id"])
    other_headers = auth_headers(other)
    assert client.get(url, headers=other_headers).json() == {"rating": None, "can_rate": False}
    assert client.delete(url, headers=other_headers).status_code == 204
    make_order(other["id"], status="completed", items=((product["id"], 1),))
    assert client.put(url, json={"rating": 1}, headers=other_headers).status_code == 200
    assert _rows(conn, product["id"]) == [
        {"user_id": author["id"], "rating": 5},
        {"user_id": other["id"], "rating": 1},
    ]
    assert client.get(url, headers=auth_headers(author)).json() == {"rating": 5, "can_rate": False}


def test_average_and_count_follow_the_ratings_in_list_and_detail(
    client: TestClient,
    make_user,
    make_product,
    make_rating,
    make_order,
    auth_headers,
    admin_headers,
) -> None:
    product = make_product()
    fans = [make_user() for _ in range(3)]
    url = _url(product["id"])
    assert _shown(client, product["id"]) == (None, 0)
    make_rating(fans[0]["id"], product["id"], 5)
    assert _shown(client, product["id"]) == (5.0, 1)
    make_rating(fans[1]["id"], product["id"], 4)
    make_rating(fans[2]["id"], product["id"], 4)
    assert _shown(client, product["id"]) == (4.3, 3)
    admin = client.get(f"/api/admin/products/{product['id']}", headers=admin_headers())
    assert (admin.json()["rating_avg"], admin.json()["rating_count"]) == (4.3, 3)
    # The first fan buys the product and changes the 5 into a 3: (3 + 4 + 4) / 3 is 3.67.
    make_order(fans[0]["id"], status="completed", items=((product["id"], 1),))
    changed = client.put(url, json={"rating": 3}, headers=auth_headers(fans[0]))
    assert changed.status_code == 200
    assert _shown(client, product["id"]) == (3.7, 3)
    # Removing that rating leaves the two 4s.
    assert client.delete(url, headers=auth_headers(fans[0])).status_code == 204
    assert _shown(client, product["id"]) == (4.0, 2)
    for fan in fans[1:]:
        assert client.delete(url, headers=auth_headers(fan)).status_code == 204
    assert _shown(client, product["id"]) == (None, 0)


def test_comments_carry_the_stars_of_their_author(
    client: TestClient,
    make_user,
    make_product,
    make_rating,
    make_comment,
    auth_headers,
    admin_headers,
) -> None:
    product = make_product()
    fan = make_user()
    silent = make_user()
    make_rating(fan["id"], product["id"], 2)
    make_comment(product["id"], fan["id"], body="Works")
    make_comment(product["id"], silent["id"], body="Question?")
    url = f"/api/products/{product['id']}/comments"

    def stars(items: list[dict]) -> dict[str, int | None]:
        return {item["body"]: item["rating"] for item in items}

    assert stars(client.get(url).json()["items"]) == {"Works": 2, "Question?": None}
    created = client.post(url, json={"body": "Again"}, headers=auth_headers(fan))
    assert created.json()["rating"] == 2
    mine = client.get("/api/me/comments", headers=auth_headers(fan))
    assert stars(mine.json()["items"]) == {"Works": 2, "Again": 2}
    everyone = client.get("/api/admin/comments", headers=admin_headers())
    assert stars(everyone.json()["items"]) == {"Works": 2, "Question?": None, "Again": 2}


def test_deleting_a_product_removes_its_ratings(
    client: TestClient,
    conn: psycopg.Connection,
    make_user,
    make_product,
    make_rating,
    admin_headers,
) -> None:
    product = make_product()
    make_rating(make_user()["id"], product["id"], 5)
    response = client.delete(f"/api/admin/products/{product['id']}", headers=admin_headers())
    assert response.status_code == 204
    assert conn.execute("SELECT count(*) AS n FROM product_ratings").fetchone()["n"] == 0


def test_status_answers_existence_activity_rating_and_purchase_in_one_row(
    conn, make_user, make_product, make_order, make_rating
) -> None:
    user = make_user()
    bought = make_product()
    other = make_product()
    inactive = make_product(is_active=False)
    make_order(user["id"], status="completed", items=((bought["id"], 1),))
    make_rating(user["id"], bought["id"], 4)

    assert ratings.status(conn, user["id"], 999_999) is None
    assert ratings.status(conn, user["id"], inactive["id"]) == {
        "is_active": False,
        "rating": None,
        "can_rate": False,
    }
    assert ratings.status(conn, user["id"], other["id"]) == {
        "is_active": True,
        "rating": None,
        "can_rate": False,
    }
    assert ratings.status(conn, user["id"], bought["id"]) == {
        "is_active": True,
        "rating": 4,
        "can_rate": True,
    }
