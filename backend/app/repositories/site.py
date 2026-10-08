"""SQL for the single site settings row (id 1). The first read creates the default row."""

import psycopg
from psycopg import sql

# The ten data columns, in the order every statement below uses them. The id is always 1.
_COLUMNS = (
    "site_name",
    "description",
    "address",
    "phone",
    "email",
    "facebook",
    "instagram",
    "pinterest",
    "about_text",
    "contact_text",
)
_COLUMN_LIST = sql.SQL(", ").join(sql.Identifier(column) for column in _COLUMNS)
_PLACEHOLDERS = sql.SQL(", ").join(sql.Placeholder() for _ in _COLUMNS)
_ASSIGNMENTS = sql.SQL(", ").join(
    sql.SQL("{0} = EXCLUDED.{0}").format(sql.Identifier(column)) for column in _COLUMNS
)

_ENSURE_ROW = "INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING"
_SELECT = sql.SQL("SELECT {} FROM site_settings WHERE id = 1").format(_COLUMN_LIST)
_UPSERT = sql.SQL(
    "INSERT INTO site_settings (id, {columns}) VALUES (1, {values}) "
    "ON CONFLICT (id) DO UPDATE SET {assignments} RETURNING {columns}"
).format(columns=_COLUMN_LIST, values=_PLACEHOLDERS, assignments=_ASSIGNMENTS)


def get(conn: psycopg.Connection) -> dict:
    """Return the ten data columns, creating the default row if it does not exist yet."""
    conn.execute(_ENSURE_ROW)
    return conn.execute(_SELECT).fetchone()


def put(conn: psycopg.Connection, data: dict) -> dict:
    """Insert or replace the row. `data` must hold exactly the ten data columns."""
    return conn.execute(_UPSERT, tuple(data[column] for column in _COLUMNS)).fetchone()
