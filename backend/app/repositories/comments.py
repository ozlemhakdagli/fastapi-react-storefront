"""SQL for product comments. Author and product names come from joins, so each read is one query."""

import psycopg


def list_for_product(
    conn: psycopg.Connection, product_id: int, limit: int, offset: int
) -> list[dict]:
    """One page of a product's comments, newest first. Email is never selected here."""
    return conn.execute(
        """
        SELECT c.id, c.product_id, c.user_id, u.full_name AS author_name, c.body, c.created_at,
               pr.rating
        FROM comments AS c
        JOIN users AS u ON u.id = c.user_id
        LEFT JOIN product_ratings AS pr ON pr.user_id = c.user_id AND pr.product_id = c.product_id
        WHERE c.product_id = %s
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT %s OFFSET %s
        """,
        (product_id, limit, offset),
    ).fetchall()


def count_for_product(conn: psycopg.Connection, product_id: int) -> int:
    row = conn.execute(
        "SELECT count(*) AS n FROM comments WHERE product_id = %s", (product_id,)
    ).fetchone()
    return row["n"]


def create(conn: psycopg.Connection, product_id: int, user_id: int, body: str) -> dict | None:
    """Insert a comment on an active product. Returns None when the product is missing or inactive.

    The INSERT selects from products, so a missing or inactive product inserts no row at all.
    """
    return conn.execute(
        """
        WITH inserted AS (
            INSERT INTO comments (product_id, user_id, body)
            SELECT p.id, %s::bigint, %s::text FROM products AS p
            WHERE p.id = %s AND p.is_active
            RETURNING id, product_id, user_id, body, created_at
        )
        SELECT i.id, i.product_id, i.user_id, u.full_name AS author_name, i.body, i.created_at,
               pr.rating
        FROM inserted AS i
        JOIN users AS u ON u.id = i.user_id
        LEFT JOIN product_ratings AS pr ON pr.user_id = i.user_id AND pr.product_id = i.product_id
        """,
        (user_id, body, product_id),
    ).fetchone()


def get(conn: psycopg.Connection, comment_id: int) -> dict | None:
    return conn.execute(
        "SELECT id, product_id, user_id, body, created_at FROM comments WHERE id = %s",
        (comment_id,),
    ).fetchone()


def delete(conn: psycopg.Connection, comment_id: int) -> dict | None:
    """Delete one comment. Returns its id, or None when no row has this id."""
    return conn.execute("DELETE FROM comments WHERE id = %s RETURNING id", (comment_id,)).fetchone()


def list_for_user(conn: psycopg.Connection, user_id: int, limit: int, offset: int) -> list[dict]:
    """One page of a user's own comments, newest first, with the product name."""
    return conn.execute(
        """
        SELECT c.id, c.product_id, c.user_id, u.full_name AS author_name, c.body, c.created_at,
               p.name AS product_name, pr.rating
        FROM comments AS c
        JOIN users AS u ON u.id = c.user_id
        JOIN products AS p ON p.id = c.product_id
        LEFT JOIN product_ratings AS pr ON pr.user_id = c.user_id AND pr.product_id = c.product_id
        WHERE c.user_id = %s
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT %s OFFSET %s
        """,
        (user_id, limit, offset),
    ).fetchall()


def count_for_user(conn: psycopg.Connection, user_id: int) -> int:
    row = conn.execute(
        "SELECT count(*) AS n FROM comments WHERE user_id = %s", (user_id,)
    ).fetchone()
    return row["n"]


def list_admin(conn: psycopg.Connection, limit: int, offset: int) -> list[dict]:
    """One page of all comments, newest first, with the author's email for moderation."""
    return conn.execute(
        """
        SELECT c.id, c.product_id, c.user_id, u.full_name AS author_name, c.body, c.created_at,
               p.name AS product_name, u.email AS author_email, pr.rating
        FROM comments AS c
        JOIN users AS u ON u.id = c.user_id
        JOIN products AS p ON p.id = c.product_id
        LEFT JOIN product_ratings AS pr ON pr.user_id = c.user_id AND pr.product_id = c.product_id
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT %s OFFSET %s
        """,
        (limit, offset),
    ).fetchall()


def count_admin(conn: psycopg.Connection) -> int:
    row = conn.execute("SELECT count(*) AS n FROM comments").fetchone()
    return row["n"]
