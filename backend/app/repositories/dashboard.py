"""SQL for the admin dashboard counters."""

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


def counts(conn: psycopg.Connection) -> dict:
    """Return new_orders, unread_messages, products and customers as integers."""
    return conn.execute(_COUNTS).fetchone()
