"""SQL for star ratings. Every statement is scoped to one user_id."""

import psycopg


def status(conn: psycopg.Connection, user_id: int, product_id: int) -> dict | None:
    """None when the product is missing, otherwise is_active, rating and can_rate."""
    return conn.execute(
        """
        SELECT p.is_active, r.rating,
               EXISTS (
                   SELECT 1 FROM orders AS o
                   JOIN order_items AS oi ON oi.order_id = o.id
                   WHERE o.user_id = %(user_id)s AND oi.product_id = p.id AND o.status = 'completed'
               ) AS can_rate
        FROM products AS p
        LEFT JOIN product_ratings AS r ON r.product_id = p.id AND r.user_id = %(user_id)s
        WHERE p.id = %(product_id)s
        """,
        {"user_id": user_id, "product_id": product_id},
    ).fetchone()


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
