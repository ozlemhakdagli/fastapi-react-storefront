"""SQL for categories and brands. Both tables have the same shape; `kind` picks the table."""

from typing import Literal

import psycopg
from psycopg import sql

Kind = Literal["categories", "brands"]

# Hard-coded whitelists: a kind reaches the SQL text only through these dicts.
_TABLES: dict[str, str] = {"categories": "categories", "brands": "brands"}
# The products column that references each table (ON DELETE RESTRICT).
_PRODUCT_COLUMNS: dict[str, str] = {"categories": "category_id", "brands": "brand_id"}


def _table(kind: Kind) -> sql.Identifier:
    return sql.Identifier(_TABLES[kind])


def list_all(conn: psycopg.Connection, kind: Kind) -> list[dict]:
    query = sql.SQL("SELECT id, name, description FROM {} ORDER BY name").format(_table(kind))
    return conn.execute(query).fetchall()


def create(conn: psycopg.Connection, kind: Kind, name: str, description: str) -> dict:
    query = sql.SQL(
        "INSERT INTO {} (name, description) VALUES (%s, %s) RETURNING id, name, description"
    ).format(_table(kind))
    return conn.execute(query, (name, description)).fetchone()


def update(
    conn: psycopg.Connection, kind: Kind, item_id: int, name: str, description: str
) -> dict | None:
    """Replace the name and description. Returns None when no row has this id."""
    query = sql.SQL(
        "UPDATE {} SET name = %s, description = %s WHERE id = %s RETURNING id, name, description"
    ).format(_table(kind))
    return conn.execute(query, (name, description, item_id)).fetchone()


def delete(conn: psycopg.Connection, kind: Kind, item_id: int) -> dict | None:
    """Delete one row. Returns its id, or None when no row has this id."""
    query = sql.SQL("DELETE FROM {} WHERE id = %s RETURNING id").format(_table(kind))
    return conn.execute(query, (item_id,)).fetchone()


def has_products(conn: psycopg.Connection, kind: Kind, item_id: int) -> dict | None:
    """Return the id of one product that uses this item, or None when no product does."""
    column = sql.Identifier(_PRODUCT_COLUMNS[kind])
    query = sql.SQL("SELECT id FROM products WHERE {} = %s LIMIT 1").format(column)
    return conn.execute(query, (item_id,)).fetchone()
