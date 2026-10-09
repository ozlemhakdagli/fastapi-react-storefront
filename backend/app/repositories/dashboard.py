"""SQL for the admin dashboard: the counters, the status totals, the 14-day chart and two lists."""

import psycopg

# One statement reads all four counters, so they describe the same moment.
_COUNTS = (
    "SELECT "
    "(SELECT count(*) FROM orders WHERE status = 'new') AS new_orders, "
    "(SELECT count(*) FROM messages WHERE direction = 'inbound' AND status = 'new') "
    "AS unread_messages, "
    "(SELECT count(*) FROM products) AS products, "
    "(SELECT count(*) FROM users WHERE role = 'customer' AND is_active) AS customers"
)

# Orders of every status, all time, counted in one pass.
_ORDERS_BY_STATUS = (
    "SELECT "
    "count(*) FILTER (WHERE status = 'new') AS new, "
    "count(*) FILTER (WHERE status = 'approved') AS approved, "
    "count(*) FILTER (WHERE status = 'rejected') AS rejected, "
    "count(*) FILTER (WHERE status = 'cancelled') AS cancelled, "
    "count(*) FILTER (WHERE status = 'shipped') AS shipped, "
    "count(*) FILTER (WHERE status = 'completed') AS completed "
    "FROM orders"
)

# One row per calendar day of the window, oldest first, ending today. The days come from
# generate_series and the orders are grouped by created_at::date, both in the database's time zone,
# so days without orders are zero-filled by the left join. Rejected and cancelled orders count as
# orders but not as revenue. Only the orders of the window are grouped, through the
# orders_created_idx index.
_ORDERS_PER_DAY = (
    "SELECT days.day::date AS date, "
    "COALESCE(daily.orders, 0) AS orders, "
    "COALESCE(daily.revenue, 0) AS revenue "
    "FROM generate_series(current_date - (%(days)s::int - 1), current_date, interval '1 day') "
    "AS days(day) "
    "LEFT JOIN ("
    "  SELECT created_at::date AS day, count(*) AS orders, "
    "  sum(total) FILTER (WHERE status IN ('new', 'approved', 'shipped', 'completed')) AS revenue "
    "  FROM orders "
    "  WHERE created_at >= current_date - (%(days)s::int - 1) "
    "  GROUP BY created_at::date"
    ") AS daily ON daily.day = days.day::date "
    "ORDER BY days.day"
)

_RECENT_ORDERS = (
    "SELECT o.id, u.full_name AS customer_name, o.status, o.total, o.created_at "
    "FROM orders o JOIN users u ON u.id = o.user_id "
    "ORDER BY o.created_at DESC, o.id DESC LIMIT %s"
)

_LOW_STOCK = (
    "SELECT id, sku, name, stock FROM products "
    "WHERE is_active AND stock <= %s ORDER BY stock, name, id LIMIT %s"
)


def counts(conn: psycopg.Connection) -> dict:
    """Return new_orders, unread_messages, products and customers as integers."""
    return conn.execute(_COUNTS).fetchone()


def orders_by_status(conn: psycopg.Connection) -> dict:
    """Return the number of orders for each of the six statuses (zero when there are none)."""
    return conn.execute(_ORDERS_BY_STATUS).fetchone()


def orders_per_day(conn: psycopg.Connection, days: int = 14) -> list[dict]:
    """Return date, orders and revenue for each of the last `days` days, oldest first."""
    return conn.execute(_ORDERS_PER_DAY, {"days": days}).fetchall()


def recent_orders(conn: psycopg.Connection, limit: int = 5) -> list[dict]:
    """Return the newest orders first, with the customer's full name."""
    return conn.execute(_RECENT_ORDERS, (limit,)).fetchall()


def low_stock(conn: psycopg.Connection, threshold: int = 5, limit: int = 8) -> list[dict]:
    """Return active products whose stock is at or below `threshold`, lowest stock first."""
    return conn.execute(_LOW_STOCK, (threshold, limit)).fetchall()
