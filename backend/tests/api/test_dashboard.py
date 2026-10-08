"""Admin dashboard: the four counters and the admin-only guard."""

from fastapi.testclient import TestClient


def test_dashboard_requires_admin(client: TestClient, make_user, auth_headers) -> None:
    anonymous = client.get("/api/admin/dashboard")
    assert anonymous.status_code == 401
    assert anonymous.json() == {"detail": "unauthorized"}

    customer = make_user()
    forbidden = client.get("/api/admin/dashboard", headers=auth_headers(customer))
    assert forbidden.status_code == 403
    assert forbidden.json() == {"detail": "forbidden"}

    # The one active customer above is counted; the admin is not a customer, so it is not.
    admin = client.get("/api/admin/dashboard", headers=auth_headers(make_user(role="admin")))
    assert admin.status_code == 200
    assert admin.json() == {"new_orders": 0, "unread_messages": 0, "products": 0, "customers": 1}


def test_dashboard_counts(
    client: TestClient,
    admin_headers,
    make_user,
    make_product,
    make_order,
    make_message,
) -> None:
    customer = make_user()
    other_customer = make_user()
    make_user(is_active=False)  # inactive customers are not counted
    product = make_product()
    make_product()
    make_product()
    make_product(is_active=False)  # inactive products still count as products
    items = ((product["id"], 1),)
    make_order(customer["id"], status="new", items=items)
    make_order(other_customer["id"], status="new", items=items)
    make_order(other_customer["id"], status="shipped", items=items)
    make_message(direction="inbound", status="new")
    make_message(direction="inbound", status="new")
    make_message(direction="inbound", status="read")
    make_message(direction="outbound", user_id=customer["id"], status="new")

    response = client.get("/api/admin/dashboard", headers=admin_headers())

    assert response.status_code == 200
    assert response.json() == {"new_orders": 2, "unread_messages": 2, "products": 4, "customers": 2}
