"""SQL for star ratings. Every statement is scoped to one user_id."""

import psycopg


def get(conn: psycopg.Connection, user_id: int, product_id: int) -> int | None:
    row = conn.execute(
        "SELECT rating FROM product_ratings WHERE user_id = %s AND product_id = %s",
        (user_id, product_id),
    ).fetchone()
    return None if row is None else row["rating"]


def has_purchased(conn: psycopg.Connection, user_id: int, product_id: int) -> bool:
    """True when one of the user's completed orders contains the product."""
    row = conn.execute(
        """
        SELECT EXISTS (
            SELECT 1 FROM orders AS o
            JOIN order_items AS oi ON oi.order_id = o.id
            WHERE o.user_id = %s AND oi.product_id = %s AND o.status = 'completed'
        ) AS purchased
        """,
        (user_id, product_id),
    ).fetchone()
    return row["purchased"]


def set_rating(conn: psycopg.Connection, user_id: int, product_id: int, rating: int) -> int | None:
    """Create or replace the user's rating. Returns the rating, or None when nothing was written.

    The INSERT selects from an active product that one of the user's completed orders contains,
    so a missing or inactive product, or a product the user has not bought, writes no row at all.
    """
    row = conn.execute(
        """
        INSERT INTO product_ratings (user_id, product_id, rating)
        SELECT %s::bigint, p.id, %s::smallint FROM products AS p
        WHERE p.id = %s AND p.is_active AND EXISTS (
            SELECT 1 FROM orders AS o
            JOIN order_items AS oi ON oi.order_id = o.id
            WHERE o.user_id = %s::bigint AND oi.product_id = p.id AND o.status = 'completed'
        )
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()
        RETURNING rating
        """,
        (user_id, rating, product_id, user_id),
    ).fetchone()
    return None if row is None else row["rating"]


def remove(conn: psycopg.Connection, user_id: int, product_id: int) -> None:
    """Delete the user's rating. Deleting a missing rating does nothing."""
    conn.execute(
        "DELETE FROM product_ratings WHERE user_id = %s AND product_id = %s",
        (user_id, product_id),
    )
