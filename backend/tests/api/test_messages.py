"""Messages: guest and member contact, the customer's own messages, and the admin inbox."""

import psycopg
from fastapi.testclient import TestClient

CONTACT = {
    "name": "Guest Visitor",
    "email": "guest@example.com",
    "subject": "Question",
    "body": "Do you ship abroad?",
}


def test_guest_contact_creates_inbound_new_message_without_user(
    client: TestClient, conn: psycopg.Connection
) -> None:
    response = client.post(
        "/api/contact",
        json={**CONTACT, "email": "  Guest@Example.COM ", "phone": "5550001122"},
    )
    assert response.status_code == 201
    assert set(response.json()) == {"id"}

    row = conn.execute("SELECT * FROM messages WHERE id = %s", (response.json()["id"],)).fetchone()
    assert row["direction"] == "inbound"
    assert row["status"] == "new"
    assert row["user_id"] is None
    assert (row["name"], row["email"], row["phone"]) == (
        "Guest Visitor",
        "guest@example.com",
        "5550001122",
    )


def test_logged_in_contact_sets_user_id(
    client: TestClient, conn: psycopg.Connection, make_user, auth_headers
) -> None:
    user = make_user()
    response = client.post(
        "/api/contact", json={**CONTACT, "email": user["email"]}, headers=auth_headers(user)
    )
    assert response.status_code == 201

    row = conn.execute("SELECT * FROM messages WHERE id = %s", (response.json()["id"],)).fetchone()
    assert row["user_id"] == user["id"]
    assert row["direction"] == "inbound"
    assert row["status"] == "new"


def test_contact_validation(client: TestClient) -> None:
    assert client.post("/api/contact", json=CONTACT).status_code == 201
    invalid = [
        {**CONTACT, "email": "not-an-email"},
        {**CONTACT, "subject": ""},
        {**CONTACT, "body": "x" * 5001},
    ]
    for payload in invalid:
        response = client.post("/api/contact", json=payload)
        assert response.status_code == 422, payload


def test_me_messages_returns_only_own_rows_newest_first(
    client: TestClient, make_user, make_message, auth_headers
) -> None:
    user = make_user()
    other = make_user()
    inbound = make_message(direction="inbound", user_id=user["id"])
    outbound = make_message(direction="outbound", user_id=user["id"], status="read")
    make_message(direction="inbound", user_id=other["id"])
    # A guest who writes with the user's email has no account, so the row has no user_id.
    guest = client.post("/api/contact", json={**CONTACT, "email": user["email"]})
    assert guest.status_code == 201

    response = client.get("/api/me/messages", headers=auth_headers(user))
    assert response.status_code == 200
    page = response.json()
    assert page["total"] == 2
    assert [item["id"] for item in page["items"]] == [outbound["id"], inbound["id"]]
    # The customer view never exposes the admin-only fields.
    assert "admin_note" not in page["items"][0]
    assert "user_id" not in page["items"][0]


def test_admin_list_filters_by_status_and_direction(
    client: TestClient, make_user, make_message, admin_headers
) -> None:
    user = make_user()
    new_in = make_message(status="new")
    read_in = make_message(status="read")
    read_out = make_message(direction="outbound", user_id=user["id"], status="read")
    headers = admin_headers()

    def ids(query: str) -> list[int]:
        response = client.get(f"/api/admin/messages{query}", headers=headers)
        assert response.status_code == 200, query
        return sorted(item["id"] for item in response.json()["items"])

    assert ids("") == sorted([new_in["id"], read_in["id"], read_out["id"]])
    assert ids("?status=new") == [new_in["id"]]
    assert ids("?direction=outbound") == [read_out["id"]]
    # Both filters apply together, so only the inbound read message matches.
    assert ids("?status=read&direction=inbound") == [read_in["id"]]


def test_admin_get_has_no_side_effects(
    client: TestClient, conn: psycopg.Connection, make_message, admin_headers
) -> None:
    message = make_message(status="new")
    response = client.get(f"/api/admin/messages/{message['id']}", headers=admin_headers())
    assert response.status_code == 200
    assert response.json()["status"] == "new"

    stored = conn.execute("SELECT status FROM messages WHERE id = %s", (message["id"],)).fetchone()
    assert stored["status"] == "new"


def test_admin_patch_status_and_note(client: TestClient, make_message, admin_headers) -> None:
    message = make_message(status="new")
    headers = admin_headers()
    url = f"/api/admin/messages/{message['id']}"
    response = client.patch(
        url, json={"status": "read", "admin_note": "Called back"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "read"
    assert response.json()["admin_note"] == "Called back"

    # An empty PATCH is valid: it changes nothing and answers with the current message.
    unchanged = client.patch(url, json={}, headers=headers)
    assert unchanged.status_code == 200
    assert unchanged.json()["status"] == "read"
    assert unchanged.json()["admin_note"] == "Called back"


def test_admin_outbound_message(client: TestClient, make_user, admin_headers, auth_headers) -> None:
    user = make_user(full_name="Ada Customer")
    headers = admin_headers()
    response = client.post(
        "/api/admin/messages",
        json={"user_id": user["id"], "subject": "Your order", "body": "We are on it."},
        headers=headers,
    )
    assert response.status_code == 201
    created = response.json()
    assert created["direction"] == "outbound"
    assert created["status"] == "read"
    assert created["user_id"] == user["id"]
    assert created["name"] == "Ada Customer"
    assert created["email"] == user["email"]

    mine = client.get("/api/me/messages", headers=auth_headers(user))
    assert [item["id"] for item in mine.json()["items"]] == [created["id"]]

    unknown = client.post(
        "/api/admin/messages",
        json={"user_id": user["id"] + 9999, "subject": "Hi", "body": "Hello"},
        headers=headers,
    )
    assert unknown.status_code == 422
    assert unknown.json() == {"detail": "invalid_reference", "field": "user_id"}


def test_admin_delete_gives_204_then_404(client: TestClient, make_message, admin_headers) -> None:
    message = make_message()
    headers = admin_headers()
    deleted = client.delete(f"/api/admin/messages/{message['id']}", headers=headers)
    assert deleted.status_code == 204
    again = client.delete(f"/api/admin/messages/{message['id']}", headers=headers)
    assert again.status_code == 404
    assert again.json() == {"detail": "not_found"}


def test_missing_message_gives_404_on_admin_get_and_patch(
    client: TestClient, make_message, admin_headers
) -> None:
    message = make_message()
    headers = admin_headers()
    # The existing row answers 200 first, so the 404 below comes from the lookup itself.
    assert client.get(f"/api/admin/messages/{message['id']}", headers=headers).status_code == 200
    missing = f"/api/admin/messages/{message['id'] + 1000}"
    responses = (
        client.get(missing, headers=headers),
        client.patch(missing, json={"status": "read"}, headers=headers),
    )
    for response in responses:
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}


def test_customer_gets_403_on_admin_routes(
    client: TestClient, make_user, make_message, auth_headers
) -> None:
    customer = make_user()
    headers = auth_headers(customer)
    message = make_message(direction="inbound")
    item_url = f"/api/admin/messages/{message['id']}"
    routes = (
        ("GET", "/api/admin/messages", None),
        ("POST", "/api/admin/messages", {"user_id": customer["id"], "subject": "Hi", "body": "Hi"}),
        ("GET", item_url, None),
        ("PATCH", item_url, {"status": "read"}),
        ("DELETE", item_url, None),
    )
    for method, url, body in routes:
        anonymous = client.request(method, url, json=body)
        assert anonymous.status_code == 401, url
        forbidden = client.request(method, url, json=body, headers=headers)
        assert forbidden.status_code == 403, url
        assert forbidden.json() == {"detail": "forbidden"}, url
