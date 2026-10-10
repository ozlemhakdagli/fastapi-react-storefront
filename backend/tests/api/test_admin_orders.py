"""Admin order endpoints and the order status machine."""

import pytest

from app.services.orders import ALLOWED_TRANSITIONS


def _stock(conn, product_id: int) -> int:
    return conn.execute("SELECT stock FROM products WHERE id = %s", (product_id,)).fetchone()[
        "stock"
    ]


def _patch(client, headers, order_id: int, **body):
    return client.patch(f"/api/admin/orders/{order_id}", json=body, headers=headers)


def test_allowed_transitions_match_the_status_table() -> None:
    assert ALLOWED_TRANSITIONS == {
        "new": frozenset({"approved", "rejected", "cancelled"}),
        "approved": frozenset({"shipped", "cancelled"}),
        "shipped": frozenset({"completed"}),
        "completed": frozenset(),
        "rejected": frozenset(),
        "cancelled": frozenset(),
    }


def test_admin_orders_require_admin(
    client, make_user, make_product, make_order, auth_headers
) -> None:
    customer = make_user()
    order = make_order(customer["id"], items=((make_product()["id"], 1),))
    calls = (
        ("get", "/api/admin/orders", None),
        ("get", f"/api/admin/orders/{order['id']}", None),
        ("patch", f"/api/admin/orders/{order['id']}", {"status": "approved"}),
    )
    for method, url, body in calls:
        anonymous = client.request(method, url, json=body)
        assert anonymous.status_code == 401, (method, url)
        forbidden = client.request(method, url, json=body, headers=auth_headers(customer))
        assert forbidden.status_code == 403, (method, url)
        assert forbidden.json() == {"detail": "forbidden"}


def test_list_filters_by_status_and_includes_customer(
    client, make_user, make_product, make_order, admin_headers
) -> None:
    buyer = make_user(email="buyer@example.com", full_name="Buyer One")
    product = make_product()
    make_order(buyer["id"], status="new", items=((product["id"], 1),))
    make_order(buyer["id"], status="new", items=((product["id"], 1),))
    make_order(buyer["id"], status="approved", items=((product["id"], 1),))
    headers = admin_headers()

    everything = client.get("/api/admin/orders", headers=headers).json()
    assert everything["total"] == 3
    only_new = client.get("/api/admin/orders?status=new", headers=headers).json()
    assert only_new["total"] == 2
    assert {i["status"] for i in only_new["items"]} == {"new"}
    assert only_new["items"][0]["customer"] == {
        "id": buyer["id"],
        "email": "buyer@example.com",
        "full_name": "Buyer One",
    }
    assert client.get("/api/admin/orders?status=bogus", headers=headers).status_code == 422
    one_page = client.get("/api/admin/orders?page=2&page_size=2", headers=headers).json()
    assert len(one_page["items"]) == 1


def test_admin_detail_has_customer_and_admin_note(
    client, conn, make_user, make_product, make_order, admin_headers
) -> None:
    buyer = make_user()
    order = make_order(buyer["id"], items=((make_product()["id"], 2),))
    conn.execute("UPDATE orders SET admin_note = 'call first' WHERE id = %s", (order["id"],))
    detail = client.get(f"/api/admin/orders/{order['id']}", headers=admin_headers()).json()
    assert detail["admin_note"] == "call first"
    assert detail["customer"]["id"] == buyer["id"]
    assert detail["items"][0]["quantity"] == 2
    assert client.get("/api/admin/orders/999999", headers=admin_headers()).status_code == 404


def test_valid_transitions_follow_the_state_machine(
    client, make_user, make_product, make_order, admin_headers
) -> None:
    order = make_order(make_user()["id"], items=((make_product()["id"], 1),))
    headers = admin_headers()
    for step in ("approved", "shipped", "completed"):
        response = _patch(client, headers, order["id"], status=step)
        assert response.status_code == 200, step
        assert response.json()["status"] == step


@pytest.mark.parametrize(
    ("start", "target"),
    [("new", "completed"), ("new", "shipped"), ("completed", "new"), ("rejected", "approved"),
     ("cancelled", "new"), ("shipped", "approved")],
)  # fmt: skip
def test_invalid_transitions_give_409(
    client, make_user, make_product, make_order, admin_headers, start, target
) -> None:
    order = make_order(make_user()["id"], status=start, items=((make_product()["id"], 1),))
    response = _patch(client, admin_headers(), order["id"], status=target)
    assert response.status_code == 409
    assert response.json() == {"detail": "invalid_status_transition"}


def test_reject_and_cancel_restore_stock_once(
    client, conn, make_user, make_product, make_order, admin_headers
) -> None:
    headers = admin_headers()
    buyer = make_user()
    product = make_product(stock=3)  # as if 2 of 5 were sold by the order below

    rejected = make_order(buyer["id"], items=((product["id"], 2),))
    assert _patch(client, headers, rejected["id"], status="rejected").status_code == 200
    assert _stock(conn, product["id"]) == 5
    # The same status again is a no-op and must not add stock a second time.
    assert _patch(client, headers, rejected["id"], status="rejected").status_code == 200
    assert _stock(conn, product["id"]) == 5

    cancelled = make_order(buyer["id"], status="approved", items=((product["id"], 4),))
    assert _patch(client, headers, cancelled["id"], status="cancelled").status_code == 200
    assert _stock(conn, product["id"]) == 9
    assert _patch(client, headers, cancelled["id"], status="cancelled").status_code == 200
    assert _stock(conn, product["id"]) == 9


def test_non_restocking_transitions_leave_stock_alone(
    client, conn, make_user, make_product, make_order, admin_headers
) -> None:
    product = make_product(stock=3)
    order = make_order(make_user()["id"], items=((product["id"], 2),))
    headers = admin_headers()
    for step in ("approved", "shipped", "completed"):
        _patch(client, headers, order["id"], status=step)
    assert _stock(conn, product["id"]) == 3


def test_patch_saves_cargo_tracking_and_note(
    client, make_user, make_product, make_order, admin_headers, auth_headers
) -> None:
    buyer = make_user()
    order = make_order(buyer["id"], items=((make_product()["id"], 1),))
    response = _patch(
        client,
        admin_headers(),
        order["id"],
        cargo_company="Yurtiçi",
        tracking_no="YT123",
        admin_note="fragile",
    )
    assert response.status_code == 200
    body = response.json()
    assert (body["cargo_company"], body["tracking_no"], body["admin_note"]) == (
        "Yurtiçi",
        "YT123",
        "fragile",
    )
    assert body["status"] == "new"
    # The customer sees cargo data but never the internal note.
    mine = client.get(f"/api/orders/{order['id']}", headers=auth_headers(buyer)).json()
    assert (mine["cargo_company"], mine["tracking_no"]) == ("Yurtiçi", "YT123")
    assert "admin_note" not in mine


def test_customer_sees_status_change_made_by_admin(
    client, make_user, make_product, make_order, admin_headers, auth_headers
) -> None:
    buyer = make_user()
    order = make_order(buyer["id"], items=((make_product()["id"], 1),))
    _patch(client, admin_headers(), order["id"], status="approved")
    mine = client.get(f"/api/orders/{order['id']}", headers=auth_headers(buyer)).json()
    assert mine["status"] == "approved"
    listed = client.get("/api/orders", headers=auth_headers(buyer)).json()["items"][0]
    assert listed["status"] == "approved"


def test_a_refused_transition_saves_nothing_else(
    client, conn, make_user, make_product, make_order, admin_headers
) -> None:
    order = make_order(make_user()["id"], items=((make_product()["id"], 1),))
    response = _patch(client, admin_headers(), order["id"], status="completed", admin_note="x")
    assert response.status_code == 409
    row = conn.execute("SELECT admin_note, status FROM orders WHERE id = %s", (order["id"],))
    assert row.fetchone() == {"admin_note": None, "status": "new"}


def test_patch_unknown_order_gives_404(client, admin_headers) -> None:
    assert _patch(client, admin_headers(), 999999, status="approved").status_code == 404


def test_patch_rejects_unknown_status_and_extra_fields(
    client, make_user, make_product, make_order, admin_headers
) -> None:
    order = make_order(make_user()["id"], items=((make_product()["id"], 1),))
    headers = admin_headers()
    assert _patch(client, headers, order["id"], status="bogus").status_code == 422
    assert _patch(client, headers, order["id"], total="0.01").status_code == 422
