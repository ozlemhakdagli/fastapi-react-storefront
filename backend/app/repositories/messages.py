"""SQL for contact messages: visitor inquiries, admin replies and the admin inbox."""

import psycopg
from psycopg import sql

# Columns an admin may change through update (a hard-coded whitelist).
_UPDATABLE = ("status", "admin_note")


def create_inbound(
    conn: psycopg.Connection,
    *,
    user_id: int | None,
    name: str,
    email: str,
    phone: str | None,
    subject: str,
    body: str,
) -> dict:
    """A contact message from a visitor. The user_id is None for a guest."""
    return conn.execute(
        "INSERT INTO messages (direction, user_id, name, email, phone, subject, body) "
        "VALUES ('inbound', %s, %s, %s, %s, %s, %s) RETURNING *",
        (user_id, name, email, phone, subject, body),
    ).fetchone()


def create_outbound(conn: psycopg.Connection, *, user: dict, subject: str, body: str) -> dict:
    """An admin reply to a user. It is stored as read, with the user's name and email copied."""
    return conn.execute(
        "INSERT INTO messages (direction, user_id, name, email, subject, body, status) "
        "VALUES ('outbound', %s, %s, %s, %s, %s, 'read') RETURNING *",
        (user["id"], user["full_name"], user["email"], subject, body),
    ).fetchone()


def get_user(conn: psycopg.Connection, user_id: int) -> dict | None:
    """The id, email and full name of a user, or None when no user has this id."""
    return conn.execute(
        "SELECT id, email, full_name FROM users WHERE id = %s", (user_id,)
    ).fetchone()


def list_for_user(conn: psycopg.Connection, user_id: int, limit: int, offset: int) -> list[dict]:
    """One page of the rows whose user_id is the caller, newest first."""
    return conn.execute(
        "SELECT id, direction, subject, body, status, name, email, created_at FROM messages "
        "WHERE user_id = %s ORDER BY created_at DESC, id DESC LIMIT %s OFFSET %s",
        (user_id, limit, offset),
    ).fetchall()


def count_for_user(conn: psycopg.Connection, user_id: int) -> int:
    """The number of the user's messages."""
    return conn.execute(
        "SELECT count(*) AS total FROM messages WHERE user_id = %s", (user_id,)
    ).fetchone()["total"]


def list_admin(
    conn: psycopg.Connection,
    *,
    status: str | None,
    direction: str | None,
    limit: int,
    offset: int,
) -> list[dict]:
    """One page of the admin inbox, newest first. A filter that is None is not applied."""
    return conn.execute(
        "SELECT * FROM messages "
        "WHERE (%s::text IS NULL OR status = %s) AND (%s::text IS NULL OR direction = %s) "
        "ORDER BY created_at DESC, id DESC LIMIT %s OFFSET %s",
        (status, status, direction, direction, limit, offset),
    ).fetchall()


def count_admin(conn: psycopg.Connection, *, status: str | None, direction: str | None) -> int:
    """The number of messages matching the same filters as list_admin."""
    return conn.execute(
        "SELECT count(*) AS total FROM messages "
        "WHERE (%s::text IS NULL OR status = %s) AND (%s::text IS NULL OR direction = %s)",
        (status, status, direction, direction),
    ).fetchone()["total"]


def get(conn: psycopg.Connection, message_id: int) -> dict | None:
    """One message, or None when no row has this id. Reading has no side effects."""
    return conn.execute("SELECT * FROM messages WHERE id = %s", (message_id,)).fetchone()


def update(conn: psycopg.Connection, message_id: int, fields: dict) -> dict | None:
    """Update the whitelisted columns that are in fields. Returns the row, or None when missing."""
    unknown = set(fields) - set(_UPDATABLE)
    if unknown:
        raise ValueError(f"cannot update message columns: {sorted(unknown)}")
    changes = [name for name in _UPDATABLE if name in fields]
    if not changes:
        return get(conn, message_id)
    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(name)) for name in changes
    )
    query = sql.SQL("UPDATE messages SET {} WHERE id = %s RETURNING *").format(assignments)
    return conn.execute(query, (*(fields[name] for name in changes), message_id)).fetchone()


def delete(conn: psycopg.Connection, message_id: int) -> dict | None:
    """Delete one message. Returns its id, or None when no row has this id."""
    return conn.execute("DELETE FROM messages WHERE id = %s RETURNING id", (message_id,)).fetchone()
