"""SQL for favourite products. Every statement is scoped to one user_id."""

import psycopg

# Only active products count. Newest favourite first, so the limit keeps the most recent ones.
_IDS_SQL = """
SELECT f.product_id
FROM favorites AS f
JOIN products AS p ON p.id = f.product_id
WHERE f.user_id = %s AND p.is_active
ORDER BY f.created_at DESC, f.product_id DESC
LIMIT %s
"""

# The INSERT selects from the active product, so a missing or inactive product inserts no row. The
# final SELECT reports whether the product was active, which ON CONFLICT alone cannot tell.
_ADD_SQL = """
WITH active AS (
    SELECT id FROM products WHERE id = %s AND is_active
), inserted AS (
    INSERT INTO favorites (user_id, product_id)
    SELECT %s::bigint, id FROM active
    ON CONFLICT (user_id, product_id) DO NOTHING
)
SELECT EXISTS (SELECT 1 FROM active) AS found
"""

_REMOVE_SQL = "DELETE FROM favorites WHERE user_id = %s AND product_id = %s"


def ids_for_user(conn: psycopg.Connection, user_id: int, limit: int = 1000) -> list[int]:
    """The ids of the user's active favourite products, newest favourite first."""
    rows = conn.execute(_IDS_SQL, (user_id, limit)).fetchall()
    return [row["product_id"] for row in rows]


def add(conn: psycopg.Connection, user_id: int, product_id: int) -> bool:
    """Add a favourite. Returns False when the product is missing or inactive, True otherwise.

    A favourite that exists already is kept as it is, so adding twice is harmless.
    """
    return conn.execute(_ADD_SQL, (product_id, user_id)).fetchone()["found"]


def remove(conn: psycopg.Connection, user_id: int, product_id: int) -> None:
    """Remove a favourite. Removing one that does not exist does nothing."""
    conn.execute(_REMOVE_SQL, (user_id, product_id))
