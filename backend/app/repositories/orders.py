"""SQL for orders, order items and the cart/stock statements of checkout."""

from decimal import Decimal

import psycopg
from psycopg import sql

_ORDER_SELECT = """
    SELECT o.*,
           (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id)
               AS item_count,
           u.id AS customer_id, u.email AS customer_email, u.full_name AS customer_full_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
"""

# Columns an admin may change through update_fields (a hard-coded whitelist).
_UPDATABLE = ("status", "cargo_company", "tracking_no", "admin_note")


def _with_customer(row: dict) -> dict:
    customer = {
        "id": row.pop("customer_id"),
        "email": row.pop("customer_email"),
        "full_name": row.pop("customer_full_name"),
    }
    return {**row, "customer": customer}


# --- checkout -------------------------------------------------------------------------------


def cart_lines_for_update(conn: psycopg.Connection, user_id: int) -> list[dict]:
    """The user's cart lines in product id order, locked so a concurrent checkout waits."""
    return conn.execute(
        "SELECT product_id, quantity FROM cart_items WHERE user_id = %s "
        "ORDER BY product_id FOR UPDATE",
        (user_id,),
    ).fetchall()


def decrement_stock(conn: psycopg.Connection, product_id: int, quantity: int) -> dict | None:
    """Take stock atomically. Returns the current price and name, or None when it cannot be taken."""
    return conn.execute(
        "UPDATE products SET stock = stock - %s, updated_at = now() "
        "WHERE id = %s AND is_active AND stock >= %s RETURNING price, name",
        (quantity, product_id, quantity),
    ).fetchone()


def product_is_active(conn: psycopg.Connection, product_id: int) -> bool | None:
    """True or False for an existing product, None when it does not exist."""
    row = conn.execute("SELECT is_active FROM products WHERE id = %s", (product_id,)).fetchone()
    return None if row is None else row["is_active"]


def insert_order(
    conn: psycopg.Connection,
    *,
    user_id: int,
    total: Decimal,
    ship_name: str,
    ship_phone: str,
    ship_address: str,
) -> dict:
    row = conn.execute(
        "INSERT INTO orders (user_id, total, ship_name, ship_phone, ship_address) "
        "VALUES (%s, %s, %s, %s, %s) RETURNING *",
        (user_id, total, ship_name, ship_phone, ship_address),
    ).fetchone()
    assert row is not None
    return row


def insert_item(
    conn: psycopg.Connection,
    *,
    order_id: int,
    product_id: int,
    product_name: str,
    unit_price: Decimal,
    quantity: int,
) -> None:
    conn.execute(
        "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, "
        "line_total) VALUES (%s, %s, %s, %s, %s, %s)",
        (order_id, product_id, product_name, unit_price, quantity, unit_price * quantity),
    )


def clear_cart(conn: psycopg.Connection, user_id: int) -> None:
    conn.execute("DELETE FROM cart_items WHERE user_id = %s", (user_id,))


# --- reading --------------------------------------------------------------------------------


def get_for_update(
    conn: psycopg.Connection, order_id: int, user_id: int | None = None
) -> dict | None:
    """Lock one order row (optionally only if it belongs to `user_id`)."""
    return conn.execute(
        "SELECT * FROM orders WHERE id = %s AND (%s::bigint IS NULL OR user_id = %s) FOR UPDATE",
        (order_id, user_id, user_id),
    ).fetchone()


def get_with_items(
    conn: psycopg.Connection, order_id: int, user_id: int | None = None
) -> dict | None:
    """An order with `items`, `item_count` and `customer`; restricted to `user_id` when given."""
    row = conn.execute(
        _ORDER_SELECT + "WHERE o.id = %s AND (%s::bigint IS NULL OR o.user_id = %s)",
        (order_id, user_id, user_id),
    ).fetchone()
    if row is None:
        return None
    items = conn.execute(
        "SELECT product_id, product_name, unit_price, quantity, line_total "
        "FROM order_items WHERE order_id = %s ORDER BY id",
        (order_id,),
    ).fetchall()
    return {**_with_customer(row), "items": items}


def list_for_user(
    conn: psycopg.Connection, user_id: int, *, limit: int, offset: int
) -> tuple[list[dict], int]:
    rows = conn.execute(
        _ORDER_SELECT
        + "WHERE o.user_id = %s ORDER BY o.created_at DESC, o.id DESC LIMIT %s OFFSET %s",
        (user_id, limit, offset),
    ).fetchall()
    total = conn.execute(
        "SELECT count(*) AS n FROM orders WHERE user_id = %s", (user_id,)
    ).fetchone()
    assert total is not None
    return [_with_customer(row) for row in rows], total["n"]


def list_admin(
    conn: psycopg.Connection, *, status: str | None, limit: int, offset: int
) -> tuple[list[dict], int]:
    rows = conn.execute(
        _ORDER_SELECT + "WHERE (%s::text IS NULL OR o.status = %s) "
        "ORDER BY o.created_at DESC, o.id DESC LIMIT %s OFFSET %s",
        (status, status, limit, offset),
    ).fetchall()
    total = conn.execute(
        "SELECT count(*) AS n FROM orders WHERE (%s::text IS NULL OR status = %s)",
        (status, status),
    ).fetchone()
    assert total is not None
    return [_with_customer(row) for row in rows], total["n"]


# --- writing --------------------------------------------------------------------------------


def update_fields(conn: psycopg.Connection, order_id: int, fields: dict) -> None:
    """Update whitelisted columns and always bump updated_at."""
    unknown = set(fields) - set(_UPDATABLE)
    if unknown:
        raise ValueError(f"cannot update order columns: {sorted(unknown)}")
    assignments = [
        sql.SQL("{} = %s").format(sql.Identifier(name)) for name in _UPDATABLE if name in fields
    ]
    values = [fields[name] for name in _UPDATABLE if name in fields]
    query = sql.SQL("UPDATE orders SET {}, updated_at = now() WHERE id = %s").format(
        sql.SQL(", ").join(assignments)
    )
    conn.execute(query, (*values, order_id))


def add_stock_back(conn: psycopg.Connection, order_id: int) -> None:
    """Return every item's quantity of the order to stock with one aggregated statement."""
    conn.execute(
        "UPDATE products p SET stock = p.stock + s.quantity, updated_at = now() "
        "FROM (SELECT product_id, SUM(quantity)::int AS quantity FROM order_items "
        "      WHERE order_id = %s GROUP BY product_id) s "
        "WHERE p.id = s.product_id",
        (order_id,),
    )
