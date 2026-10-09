"""Auth endpoints: registration, login, the current profile and password changes."""

from collections.abc import Iterator
from typing import Any

import psycopg
from fastapi.testclient import TestClient


def _login(client: TestClient, email: str, password: str):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _walk(value: Any) -> Iterator[Any]:
    """Yield every key and leaf value of a decoded JSON document."""
    if isinstance(value, dict):
        for key, item in value.items():
            yield key
            yield from _walk(item)
    elif isinstance(value, list):
        for item in value:
            yield from _walk(item)
    else:
        yield value


def test_register_returns_201_without_password_hash(
    client: TestClient, conn: psycopg.Connection
) -> None:
    response = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "Passw0rd!x", "full_name": "New User"},
    )
    assert response.status_code == 201
    assert "password_hash" not in response.json()
    assert "password" not in response.json()
    stored = conn.execute(
        "SELECT password_hash FROM users WHERE email = %s", ("new@example.com",)
    ).fetchone()
    assert stored is not None
    assert stored["password_hash"].startswith("$argon2")


def test_register_normalizes_email_and_blocks_case_variants(
    client: TestClient, conn: psycopg.Connection
) -> None:
    body = {"email": " Foo@Example.COM ", "password": "Passw0rd!x", "full_name": "Foo"}
    response = client.post("/api/auth/register", json=body)
    assert response.status_code == 201
    assert response.json()["email"] == "foo@example.com"
    stored = conn.execute("SELECT email FROM users").fetchall()
    assert [row["email"] for row in stored] == ["foo@example.com"]

    duplicate = client.post("/api/auth/register", json={**body, "email": "FOO@example.com"})
    assert duplicate.status_code == 409
    assert duplicate.json() == {"detail": "email_taken"}


def test_register_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "Abc123!", "full_name": "Short"},
    )
    assert response.status_code == 422


def test_login_returns_token_and_user(client: TestClient, make_user) -> None:
    user = make_user(email="login@example.com")
    response = _login(client, "login@example.com", user["password"])
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["id"] == user["id"]
    assert body["user"]["email"] == "login@example.com"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["id"] == user["id"]


def test_login_is_case_insensitive(client: TestClient, make_user) -> None:
    user = make_user(email="mixed@example.com")
    response = _login(client, "  MIXED@Example.COM ", user["password"])
    assert response.status_code == 200
    assert response.json()["user"]["id"] == user["id"]


def test_login_wrong_password_and_unknown_email_are_identical(
    client: TestClient, make_user
) -> None:
    make_user(email="known@example.com")
    wrong_password = _login(client, "known@example.com", "Not-the-pass1")
    unknown_email = _login(client, "unknown@example.com", "Not-the-pass1")
    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json() == {"detail": "invalid_credentials"}
    assert unknown_email.content == wrong_password.content


def test_login_inactive_user_rejected(client: TestClient, make_user) -> None:
    user = make_user(is_active=False)
    response = _login(client, user["email"], user["password"])
    assert response.status_code == 401
    assert response.json() == {"detail": "invalid_credentials"}


def test_token_of_deactivated_user_is_rejected(
    client: TestClient, make_user, conn: psycopg.Connection
) -> None:
    user = make_user(email="leaving@example.com")
    token = _login(client, "leaving@example.com", user["password"]).json()["access_token"]
    conn.execute("UPDATE users SET is_active = false WHERE id = %s", (user["id"],))
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json() == {"detail": "unauthorized"}


def test_me_get_and_patch(client: TestClient, make_user, auth_headers) -> None:
    user = make_user(full_name="Old Name")
    headers = auth_headers(user)
    current = client.get("/api/auth/me", headers=headers)
    assert current.status_code == 200
    assert current.json()["email"] == user["email"]

    patched = client.patch(
        "/api/auth/me", headers=headers, json={"full_name": "New Name", "phone": "5551112233"}
    )
    assert patched.status_code == 200
    assert patched.json()["full_name"] == "New Name"
    assert patched.json()["phone"] == "5551112233"
    assert patched.json()["address"] is None

    partial = client.patch("/api/auth/me", headers=headers, json={"address": "Test Street 1"})
    assert partial.status_code == 200
    assert partial.json()["full_name"] == "New Name"
    assert partial.json()["phone"] == "5551112233"
    assert partial.json()["address"] == "Test Street 1"

    for forbidden in ({"role": "admin"}, {"email": "other@example.com"}, {"is_active": False}):
        response = client.patch("/api/auth/me", headers=headers, json=forbidden)
        assert response.status_code == 422, forbidden


def test_change_password(client: TestClient, make_user, auth_headers) -> None:
    user = make_user(email="pw@example.com", password="Old-passw0rd")
    headers = auth_headers(user)
    wrong = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "Not-the-one", "new_password": "New-passw0rd"},
    )
    assert wrong.status_code == 400
    assert wrong.json() == {"detail": "wrong_password"}

    changed = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "Old-passw0rd", "new_password": "New-passw0rd"},
    )
    assert changed.status_code == 204
    assert _login(client, "pw@example.com", "Old-passw0rd").status_code == 401
    assert _login(client, "pw@example.com", "New-passw0rd").status_code == 200


def test_no_response_contains_password_hash(client: TestClient, make_user, auth_headers) -> None:
    user = make_user(email="leak@example.com")
    responses = [
        client.post(
            "/api/auth/register",
            json={"email": "fresh@example.com", "password": "Passw0rd!x", "full_name": "Fresh"},
        ),
        _login(client, "leak@example.com", user["password"]),
        client.get("/api/auth/me", headers=auth_headers(user)),
    ]
    for response in responses:
        assert response.status_code in (200, 201)
        values = list(_walk(response.json()))
        assert "password_hash" not in values
        assert "password" not in values
        assert "$argon2" not in response.text


def test_login_and_register_hash_without_holding_a_database_connection(
    client, make_user, monkeypatch
) -> None:
    """Argon2 takes ~40 ms; a pooled connection must not be held meanwhile."""
    from app.services import auth as auth_service

    pool = client.app.state.pool
    in_use: list[int] = []

    def watched(real):
        def wrapper(*args, **kwargs):
            stats = pool.get_stats()
            in_use.append(stats["pool_size"] - stats["pool_available"])
            return real(*args, **kwargs)

        return wrapper

    monkeypatch.setattr(auth_service, "verify_password", watched(auth_service.verify_password))
    monkeypatch.setattr(auth_service, "hash_password", watched(auth_service.hash_password))
    user = make_user(email="known@example.com")

    known = client.post(
        "/api/auth/login", json={"email": "known@example.com", "password": user["password"]}
    )
    unknown = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "Wrong-passw0rd"}
    )
    registered = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "Passw0rd!x", "full_name": "New User"},
    )

    assert (known.status_code, unknown.status_code, registered.status_code) == (200, 401, 201)
    assert len(in_use) >= 3, "the hashing functions were not observed"
    assert set(in_use) == {0}, f"connections held while hashing: {in_use}"


def test_login_works_for_reserved_domains_and_wrong_credentials_are_401(client, make_user) -> None:
    """A seeded admin like admin@shop.local must be able to log in."""
    user = make_user(email="admin@shop.local", role="admin")
    for address in ("admin@shop.local", "  ADMIN@Shop.Local  ", "root@localhost"):
        wrong = client.post(
            "/api/auth/login", json={"email": address, "password": "Wrong-passw0rd"}
        )
        assert wrong.status_code == 401, address
        assert wrong.json() == {"detail": "invalid_credentials"}
    ok = client.post(
        "/api/auth/login", json={"email": "  ADMIN@Shop.Local  ", "password": user["password"]}
    )
    assert ok.status_code == 200
    token = ok.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "admin@shop.local"
