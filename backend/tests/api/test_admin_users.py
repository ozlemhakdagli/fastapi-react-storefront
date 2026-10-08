"""Admin user management: listing, creating and updating accounts."""

from fastapi.testclient import TestClient

NEW_USER = {
    "email": "staff@example.com",
    "password": "Staff-passw0rd",
    "full_name": "Staff Member",
    "role": "customer",
}


def test_admin_users_require_admin(client: TestClient, make_user, auth_headers) -> None:
    customer = make_user()
    headers = auth_headers(customer)
    path = f"/api/admin/users/{customer['id']}"
    assert client.get("/api/admin/users").status_code == 401
    assert client.post("/api/admin/users", json=NEW_USER).status_code == 401
    assert client.patch(path, json={"full_name": "Renamed"}).status_code == 401

    assert client.get("/api/admin/users", headers=headers).status_code == 403
    assert client.post("/api/admin/users", headers=headers, json=NEW_USER).status_code == 403
    assert client.patch(path, headers=headers, json={"full_name": "Renamed"}).status_code == 403


def test_list_filters(client: TestClient, make_user, auth_headers) -> None:
    ada = make_user(email="ada@example.com", full_name="Ada Admin", role="admin")
    make_user(email="alice@example.com", full_name="Alice Smith")
    make_user(email="bob@example.com", full_name="Bob Jones")
    headers = auth_headers(ada)

    admins = client.get("/api/admin/users", headers=headers, params={"role": "admin"}).json()
    assert [row["email"] for row in admins["items"]] == ["ada@example.com"]
    assert admins["total"] == 1

    by_name = client.get("/api/admin/users", headers=headers, params={"q": "ALICE"}).json()
    assert [row["email"] for row in by_name["items"]] == ["alice@example.com"]

    by_email = client.get("/api/admin/users", headers=headers, params={"q": "bob@"}).json()
    assert [row["email"] for row in by_email["items"]] == ["bob@example.com"]

    literal = client.get("/api/admin/users", headers=headers, params={"q": "%"}).json()
    assert literal["total"] == 0

    second_page = client.get(
        "/api/admin/users", headers=headers, params={"page": 2, "page_size": 2}
    ).json()
    assert second_page["total"] == 3
    assert second_page["page"] == 2
    assert second_page["page_size"] == 2
    assert len(second_page["items"]) == 1


def test_create_user_with_role(client: TestClient, admin_headers) -> None:
    headers = admin_headers()
    body = {**NEW_USER, "email": "Staff@Example.com", "role": "admin"}
    created = client.post("/api/admin/users", headers=headers, json=body)
    assert created.status_code == 201
    assert created.json()["email"] == "staff@example.com"
    assert created.json()["role"] == "admin"

    duplicate = client.post(
        "/api/admin/users", headers=headers, json={**body, "email": "STAFF@example.com"}
    )
    assert duplicate.status_code == 409
    assert duplicate.json() == {"detail": "email_taken"}

    login = client.post(
        "/api/auth/login",
        json={"email": "staff@example.com", "password": NEW_USER["password"]},
    )
    assert login.status_code == 200
    assert login.json()["user"]["role"] == "admin"


def test_patch_user(client: TestClient, make_user, admin_headers) -> None:
    headers = admin_headers()
    target = make_user(email="target@example.com", full_name="Old Name")
    path = f"/api/admin/users/{target['id']}"
    changed = client.patch(
        path,
        headers=headers,
        json={"full_name": "New Name", "role": "admin", "password": "Brand-new1pw"},
    )
    assert changed.status_code == 200
    assert changed.json()["full_name"] == "New Name"
    assert changed.json()["role"] == "admin"
    login = client.post(
        "/api/auth/login", json={"email": "target@example.com", "password": "Brand-new1pw"}
    )
    assert login.status_code == 200

    deactivated = client.patch(path, headers=headers, json={"is_active": False})
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False
    blocked = client.post(
        "/api/auth/login", json={"email": "target@example.com", "password": "Brand-new1pw"}
    )
    assert blocked.status_code == 401


def test_last_admin_cannot_be_demoted_or_deactivated(
    client: TestClient, make_user, auth_headers
) -> None:
    admin = make_user(role="admin")
    headers = auth_headers(admin)
    path = f"/api/admin/users/{admin['id']}"
    demoted = client.patch(path, headers=headers, json={"role": "customer"})
    assert demoted.status_code == 409
    assert demoted.json() == {"detail": "last_admin"}

    deactivated = client.patch(path, headers=headers, json={"is_active": False})
    assert deactivated.status_code == 409
    assert deactivated.json() == {"detail": "last_admin"}

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["role"] == "admin"
    assert me["is_active"] is True


def test_admin_can_deactivate_another_admin_when_two_exist(
    client: TestClient, make_user, auth_headers
) -> None:
    first = make_user(role="admin")
    second = make_user(role="admin")
    response = client.patch(
        f"/api/admin/users/{second['id']}",
        headers=auth_headers(first),
        json={"is_active": False},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_patch_unknown_user_404(client: TestClient, make_user, admin_headers) -> None:
    headers = admin_headers()
    existing = make_user()
    # Control request: the route exists, so the 404 below must come from the missing row.
    known = client.patch(
        f"/api/admin/users/{existing['id']}", headers=headers, json={"full_name": "Known"}
    )
    assert known.status_code == 200
    response = client.patch(
        "/api/admin/users/999999", headers=headers, json={"full_name": "Nobody"}
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "not_found"}
