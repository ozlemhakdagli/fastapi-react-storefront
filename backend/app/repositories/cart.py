"""SQL for the shopping cart. Every statement is scoped to one user_id."""

import psycopg

# Cart lines in product-id order. The first image is the one with the lowest position. It is
# NULL for a product without images, and the service then uses the placeholder.
_LINES_SQL = """
SELECT ci.product_id, p.name, p.price AS unit_price, ci.quantity, p.stock,
       p.is_active AS available, first_image.file_name, first_image.thumb_name
FROM cart_items AS ci
JOIN products AS p ON p.id = ci.product_id
LEFT JOIN LATERAL (
    SELECT pi.file_name, pi.thumb_name
    FROM product_images AS pi
    WHERE pi.product_id = p.id
    ORDER BY pi.position
    LIMIT 1
) AS first_image ON TRUE
WHERE ci.user_id = %s
ORDER BY ci.product_id
"""

# The product as the cart sees it: its stock, whether it is on sale, and the user's quantity.
_PRODUCT_FOR_CART_SQL = """
SELECT p.id, p.is_active, p.stock, COALESCE(ci.quantity, 0) AS cart_quantity
FROM products AS p
LEFT JOIN cart_items AS ci ON ci.product_id = p.id AND ci.user_id = %s
WHERE p.id = %s
"""

_ADD_SQL = """
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES (%s, %s, %s)
ON CONFLICT (user_id, product_id)
DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()
"""

_SET_SQL = """
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES (%s, %s, %s)
ON CONFLICT (user_id, product_id)
DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()
"""

_REMOVE_SQL = "DELETE FROM cart_items WHERE user_id = %s AND product_id = %s"


def lines(conn: psycopg.Connection, user_id: int) -> list[dict]:
    """The user's cart lines in product-id order. Lines of inactive products are included."""
    return conn.execute(_LINES_SQL, (user_id,)).fetchall()


def product_for_cart(conn: psycopg.Connection, user_id: int, product_id: int) -> dict | None:
    """The product's stock and active flag and the user's current quantity, or None if missing."""
    return conn.execute(_PRODUCT_FOR_CART_SQL, (user_id, product_id)).fetchone()


def add_quantity(conn: psycopg.Connection, user_id: int, product_id: int, quantity: int) -> None:
    """Add quantity to the user's line for the product, creating the line when needed."""
    conn.execute(_ADD_SQL, (user_id, product_id, quantity))


def set_quantity(conn: psycopg.Connection, user_id: int, product_id: int, quantity: int) -> None:
    """Set the quantity of the user's line for the product, creating the line when needed."""
    conn.execute(_SET_SQL, (user_id, product_id, quantity))


def remove(conn: psycopg.Connection, user_id: int, product_id: int) -> None:
    """Delete the user's line for the product. Deleting a missing line does nothing."""
    conn.execute(_REMOVE_SQL, (user_id, product_id))
