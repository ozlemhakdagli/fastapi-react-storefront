"""FastAPI dependencies: database connection, current user, admin check."""

from typing import Annotated

import psycopg
from fastapi import Depends, Header

from app.db import get_conn
from app.errors import ApiError
from app.security import decode_access_token

Conn = Annotated[psycopg.Connection, Depends(get_conn)]

# The user row without password_hash, so a router can never leak it by returning the dict.
_USER_QUERY = (
    "SELECT id, email, full_name, role, phone, address, is_active, created_at "
    "FROM users WHERE id = %s"
)


def _token_from_header(authorization: str | None) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise ApiError(401, "unauthorized")
    return token.strip()


def get_current_user(conn: Conn, authorization: Annotated[str | None, Header()] = None) -> dict:
    """The authenticated, active user. The role is read from the database, never from the token."""
    user_id = decode_access_token(_token_from_header(authorization))
    user = conn.execute(_USER_QUERY, (user_id,)).fetchone()
    if user is None or not user["is_active"]:
        raise ApiError(401, "unauthorized")
    return user


def get_optional_user(
    conn: Conn, authorization: Annotated[str | None, Header()] = None
) -> dict | None:
    """The current user, or None for guests and for any invalid credentials."""
    try:
        return get_current_user(conn, authorization)
    except ApiError:
        return None


CurrentUser = Annotated[dict, Depends(get_current_user)]
OptionalUser = Annotated[dict | None, Depends(get_optional_user)]


def require_admin(user: CurrentUser) -> dict:
    if user["role"] != "admin":
        raise ApiError(403, "forbidden")
    return user


AdminUser = Annotated[dict, Depends(require_admin)]
