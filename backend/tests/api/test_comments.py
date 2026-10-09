"""Product comments: public list and post, own and admin delete, my comments, admin listing."""

from datetime import UTC, datetime

import psycopg
from fastapi.testclient import TestClient

# An id that no product has (the test database is truncated after every test).
MISSING_PRODUCT_ID = 999_999_999


def _comments_url(product_id: int) -> str:
    return f"/api/products/{product_id}/comments"


def _count_comments(conn: psycopg.Connection) -> int:
    return conn.execute("SELECT count(*) AS n FROM comments").fetchone()["n"]


def test_list_is_public_paginated_newest_first_with_author_name_and_user_id(
    client: TestClient, conn: psycopg.Connection, make_user, make_product, make_comment
) -> None:
    product = make_product()
    alice = make_user(full_name="Alice")
    bob = make_user(full_name="Bob")
    oldest = make_comment(product["id"], alice["id"], body="First")
    middle = make_comment(product["id"], bob["id"], body="Second")
    newest = make_comment(product["id"], alice["id"], body="Third")
    # Explicit timestamps make the order independent of the clock resolution.
    for comment, day in ((oldest, 1), (middle, 2), (newest, 3)):
        conn.execute(
            "UPDATE comments SET created_at = %s WHERE id = %s",
            (datetime(2026, 10, day, 10, tzinfo=UTC), comment["id"]),
        )

    first = client.get(_comments_url(product["id"]), params={"page_size": 2})
    assert first.status_code == 200
    page = first.json()
    assert (page["total"], page["page"], page["page_size"]) == (3, 1, 2)
    assert [item["body"] for item in page["items"]] == ["Third", "Second"]
    # The exact shape also proves that the public list carries no author email.
    assert page["items"][0] == {
        "id": newest["id"],
        "product_id": product["id"],
        "user_id": alice["id"],
        "author_name": "Alice",
        "body": "Third",
        "created_at": "2026-10-03T10:00:00Z",
        "rating": None,
    }

    second = client.get(_comments_url(product["id"]), params={"page": 2, "page_size": 2})
    assert second.status_code == 200
    assert [item["body"] for item in second.json()["items"]] == ["First"]


def test_list_of_missing_or_inactive_product_gives_404(
    client: TestClient, make_user, make_product, make_comment
) -> None:
    product = make_product()
    make_comment(product["id"], make_user()["id"])
    # The list of an active product answers 200, so the 404s below cannot come from a missing route.
    assert client.get(_comments_url(product["id"])).status_code == 200
    inactive = make_product(is_active=False)
    for product_id in (inactive["id"], MISSING_PRODUCT_ID):
        response = client.get(_comments_url(product_id))
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}


def test_post_requires_login(client: TestClient, make_product) -> None:
    product = make_product()
    response = client.post(_comments_url(product["id"]), json={"body": "Nice"})
    assert response.status_code == 401
    assert response.json() == {"detail": "unauthorized"}


def test_post_to_missing_or_inactive_product_gives_404(
    client: TestClient, conn: psycopg.Connection, make_user, auth_headers, make_product
) -> None:
    headers = auth_headers(make_user())
    product = make_product()
    inactive = make_product(is_active=False)
    # A valid post to an active product succeeds, so the 404s below are not a missing route.
    created = client.post(_comments_url(product["id"]), json={"body": "Nice"}, headers=headers)
    assert created.status_code == 201
    for product_id in (inactive["id"], MISSING_PRODUCT_ID):
        response = client.post(_comments_url(product_id), json={"body": "Nice"}, headers=headers)
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}
    assert _count_comments(conn) == 1


def test_body_bounds(client: TestClient, make_user, auth_headers, make_product) -> None:
    headers = auth_headers(make_user())
    url = _comments_url(make_product()["id"])
    # The longest allowed body is accepted, which also shows that the route exists.
    assert client.post(url, json={"body": "x" * 2000}, headers=headers).status_code == 201
    for body in ("", "x" * 2001):
        response = client.post(url, json={"body": body}, headers=headers)
        assert response.status_code == 422, len(body)


def test_markup_is_stored_and_returned_verbatim(
    client: TestClient, conn: psycopg.Connection, make_user, auth_headers, make_product
) -> None:
    user = make_user()
    product = make_product()
    markup = "<img src=x onerror=alert(1)>"
    created = client.post(
        _comments_url(product["id"]), json={"body": markup}, headers=auth_headers(user)
    )
    assert created.status_code == 201
    assert created.json()["body"] == markup
    listed = client.get(_comments_url(product["id"])).json()
    assert [item["body"] for item in listed["items"]] == [markup]
    stored = conn.execute(
        "SELECT body FROM comments WHERE id = %s", (created.json()["id"],)
    ).fetchone()
    assert stored["body"] == markup


def test_author_can_delete_own_comment(
    client: TestClient, make_user, auth_headers, make_product, make_comment
) -> None:
    author = make_user()
    product = make_product()
    comment = make_comment(product["id"], author["id"])
    response = client.delete(f"/api/comments/{comment['id']}", headers=auth_headers(author))
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(_comments_url(product["id"])).json()["total"] == 0


def test_other_user_gets_404_when_deleting(
    client: TestClient, make_user, auth_headers, make_product, make_comment
) -> None:
    author = make_user()
    stranger = make_user()
    product = make_product()
    comment = make_comment(product["id"], author["id"])
    url = f"/api/comments/{comment['id']}"

    refused = client.delete(url, headers=auth_headers(stranger))
    assert refused.status_code == 404
    assert refused.json() == {"detail": "not_found"}
    # The comment survived the stranger's request, and the author can still delete it.
    assert client.get(_comments_url(product["id"])).json()["total"] == 1
    assert client.delete(url, headers=auth_headers(author)).status_code == 204


def test_admin_can_delete_any_comment(
    client: TestClient, make_user, auth_headers, make_product, make_comment
) -> None:
    author = make_user()
    admin = make_user(role="admin")
    product = make_product()
    comment = make_comment(product["id"], author["id"])
    response = client.delete(f"/api/comments/{comment['id']}", headers=auth_headers(admin))
    assert response.status_code == 204
    assert client.get(_comments_url(product["id"])).json()["total"] == 0


def test_anonymous_delete_gives_401(
    client: TestClient, make_user, make_product, make_comment
) -> None:
    author = make_user()
    product = make_product()
    comment = make_comment(product["id"], author["id"])
    response = client.delete(f"/api/comments/{comment['id']}")
    assert response.status_code == 401
    assert response.json() == {"detail": "unauthorized"}
    assert client.get(_comments_url(product["id"])).json()["total"] == 1


def test_my_comments_only_lists_own_with_product_name(
    client: TestClient, make_user, auth_headers, make_product, make_comment
) -> None:
    me = make_user()
    other = make_user()
    shoe = make_product(name="Running Shoe")
    bag = make_product(name="Travel Bag")
    mine = make_comment(shoe["id"], me["id"], body="Fits well")
    make_comment(bag["id"], other["id"], body="Not mine")

    assert client.get("/api/me/comments").status_code == 401
    response = client.get("/api/me/comments", headers=auth_headers(me))
    assert response.status_code == 200
    page = response.json()
    assert page["total"] == 1
    assert [item["id"] for item in page["items"]] == [mine["id"]]
    assert page["items"][0]["product_id"] == shoe["id"]
    assert page["items"][0]["product_name"] == "Running Shoe"


def test_admin_list_includes_author_email_and_requires_admin(
    client: TestClient, make_user, auth_headers, make_product, make_comment
) -> None:
    author = make_user(email="writer@example.com", full_name="Writer")
    admin = make_user(role="admin")
    product = make_product(name="Lamp")
    make_comment(product["id"], author["id"], body="Bright")

    response = client.get("/api/admin/comments", headers=auth_headers(admin))
    assert response.status_code == 200
    page = response.json()
    assert page["total"] == 1
    item = page["items"][0]
    assert item["author_email"] == "writer@example.com"
    assert item["author_name"] == "Writer"
    assert item["product_name"] == "Lamp"

    customer = client.get("/api/admin/comments", headers=auth_headers(author))
    assert customer.status_code == 403
    assert customer.json() == {"detail": "forbidden"}
    assert client.get("/api/admin/comments").status_code == 401
