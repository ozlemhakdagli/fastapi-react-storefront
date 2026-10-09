"""Admin dashboard: the counters, the 14-day chart, recent orders, low stock and the admin guard."""

import datetime

import psycopg
from fastapi.testclient import TestClient

COUNTERS = ("new_orders", "unread_messages", "products", "customers")
STATUSES = ("new", "approved", "rejected", "cancelled", "shipped", "completed")


def _counters(body: dict) -> dict:
    return {key: body[key] for key in COUNTERS}


def _today(conn: psycopg.Connection) -> datetime.date:
    """Today on the database clock, which is the day the dashboard counts from."""
    return conn.execute("SELECT current_date AS today").fetchone()["today"]


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
    assert _counters(admin.json()) == {
        "new_orders": 0,
        "unread_messages": 0,
        "products": 0,
        "customers": 1,
    }


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
    assert _counters(response.json()) == {
        "new_orders": 2,
        "unread_messages": 2,
        "products": 4,
        "customers": 2,
    }


def test_empty_shop_has_zero_filled_statistics(client, admin_headers, conn) -> None:
    body = client.get("/api/admin/dashboard", headers=admin_headers()).json()

    assert body["orders_by_status"] == dict.fromkeys(STATUSES, 0)
    # Fourteen days, oldest first; the last one is today.
    today = _today(conn)
    days = [today - datetime.timedelta(days=back) for back in range(13, -1, -1)]
    assert body["orders_per_day"] == [
        {"date": day.isoformat(), "orders": 0, "revenue": "0.00"} for day in days
    ]
    assert body["recent_orders"] == []
    assert body["low_stock"] == []


def test_today_counts_every_order_and_sums_open_and_completed_revenue(
    client, admin_headers, conn, make_user, make_product, make_order
) -> None:
    customer = make_user()
    new_item = make_product(price="100.00")
    completed_item = make_product(price="50.50")
    cancelled_item = make_product(price="70.00")
    make_order(customer["id"], status="new", items=((new_item["id"], 1),))
    make_order(customer["id"], status="completed", items=((completed_item["id"], 1),))
    make_order(customer["id"], status="cancelled", items=((cancelled_item["id"], 1),))

    body = client.get("/api/admin/dashboard", headers=admin_headers()).json()

    assert body["orders_by_status"] == {
        "new": 1,
        "approved": 0,
        "rejected": 0,
        "cancelled": 1,
        "shipped": 0,
        "completed": 1,
    }
    today = _today(conn)
    assert body["orders_per_day"][-1] == {
        "date": today.isoformat(),
        "orders": 3,
        "revenue": "150.50",
    }


def test_revenue_counts_approved_shipped_and_completed_only(
    client, admin_headers, conn, make_user, make_product, make_order
) -> None:
    customer = make_user()
    approved = make_product(price="10.00")
    shipped = make_product(price="20.00")
    rejected = make_product(price="40.00")
    older = make_product(price="5.25")
    make_order(customer["id"], status="approved", items=((approved["id"], 1),))
    make_order(customer["id"], status="shipped", items=((shipped["id"], 1),))
    make_order(customer["id"], status="rejected", items=((rejected["id"], 1),))
    old_order = make_order(customer["id"], status="completed", items=((older["id"], 1),))
    conn.execute(
        "UPDATE orders SET created_at = now() - interval '3 days' WHERE id = %s",
        (old_order["id"],),
    )

    body = client.get("/api/admin/dashboard", headers=admin_headers()).json()

    assert body["orders_by_status"] == {
        "new": 0,
        "approved": 1,
        "rejected": 1,
        "cancelled": 0,
        "shipped": 1,
        "completed": 1,
    }
    today = _today(conn)
    three_days_ago = today - datetime.timedelta(days=3)
    by_date = {day["date"]: day for day in body["orders_per_day"]}
    # The rejected order counts as an order of the day but not as revenue.
    assert by_date[today.isoformat()] == {
        "date": today.isoformat(),
        "orders": 3,
        "revenue": "30.00",
    }
    assert by_date[three_days_ago.isoformat()] == {
        "date": three_days_ago.isoformat(),
        "orders": 1,
        "revenue": "5.25",
    }


def test_recent_orders_are_newest_first_with_full_names_and_capped_at_five(
    client, admin_headers, make_user, make_product, make_order
) -> None:
    customer = make_user(full_name="Ayşe Yılmaz")
    item = make_product(price="100.00")
    orders = [make_order(customer["id"], items=((item["id"], 1),)) for _ in range(6)]

    recent = client.get("/api/admin/dashboard", headers=admin_headers()).json()["recent_orders"]

    newest_first = [order["id"] for order in reversed(orders)]
    assert [row["id"] for row in recent] == newest_first[:5]
    assert set(recent[0]) == {"id", "customer_name", "status", "total", "created_at"}
    assert recent[0]["customer_name"] == "Ayşe Yılmaz"
    assert recent[0]["status"] == "new"
    assert recent[0]["total"] == "100.00"


def test_low_stock_lists_active_products_at_or_below_five(
    client, admin_headers, make_product
) -> None:
    make_product(sku="LOW-FOXTROT", name="Foxtrot", stock=0)
    echo = make_product(sku="LOW-ECHO", name="Echo", stock=1)
    make_product(sku="LOW-BRAVO", name="Bravo", stock=5)
    make_product(sku="LOW-ALPHA", name="Alpha", stock=5)
    make_product(sku="HIGH-CHARLIE", name="Charlie", stock=6)  # above the threshold
    make_product(sku="OFF-DELTA", name="Delta", stock=0, is_active=False)  # inactive

    low = client.get("/api/admin/dashboard", headers=admin_headers()).json()["low_stock"]

    # Lowest stock first, then name.
    assert [row["sku"] for row in low] == ["LOW-FOXTROT", "LOW-ECHO", "LOW-ALPHA", "LOW-BRAVO"]
    assert low[1] == {"id": echo["id"], "sku": "LOW-ECHO", "name": "Echo", "stock": 1}


def test_low_stock_is_capped_at_eight(client, admin_headers, make_product) -> None:
    for number in range(10):
        make_product(sku=f"CAP-{number:02d}", name=f"Cap {number:02d}", stock=1)

    low = client.get("/api/admin/dashboard", headers=admin_headers()).json()["low_stock"]

    assert [row["name"] for row in low] == [f"Cap {number:02d}" for number in range(8)]
