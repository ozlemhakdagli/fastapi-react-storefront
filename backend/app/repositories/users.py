"""SQL for user accounts. Functions take the connection first and return dicts.

Only get_by_email (login) and get_password_hash (password change) read password_hash. Every other
function returns the public columns, which leave it out.
"""

from psycopg import Connection, sql

# Columns that update() may set. email is deliberately absent: no endpoint may change it.
_UPDATABLE = frozenset({"full_name", "phone", "address", "role", "is_active", "password_hash"})


def _escape_like(text: str) -> str:
    """Escape LIKE wildcards so that a search term matches literally (the default escape is \\)."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def get_by_id(conn: Connection, user_id: int) -> dict | None:
    return conn.execute(
        "SELECT id, email, full_name, role, phone, address, is_active, created_at "
        "FROM users WHERE id = %s",
        (user_id,),
    ).fetchone()


def get_by_email(conn: Connection, email: str) -> dict | None:
    """Match the email ignoring case. The row includes password_hash, so only login may use it."""
    return conn.execute(
        "SELECT id, email, full_name, password_hash, role, phone, address, is_active, created_at "
        "FROM users WHERE lower(email) = lower(%s)",
        (email,),
    ).fetchone()


def get_password_hash(conn: Connection, user_id: int) -> str | None:
    row = conn.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,)).fetchone()
    return None if row is None else row["password_hash"]


def create(
    conn: Connection,
    *,
    email: str,
    password_hash: str,
    full_name: str,
    role: str = "customer",
    phone: str | None = None,
    address: str | None = None,
) -> dict:
    return conn.execute(
        "INSERT INTO users (email, password_hash, full_name, role, phone, address) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "RETURNING id, email, full_name, role, phone, address, is_active, created_at",
        (email, password_hash, full_name, role, phone, address),
    ).fetchone()


def update(conn: Connection, user_id: int, fields: dict) -> dict | None:
    """Set the given columns and return the public row, or None when the user does not exist."""
    unknown = set(fields) - _UPDATABLE
    if unknown:
        raise ValueError(f"columns that cannot be updated: {sorted(unknown)}")
    if not fields:
        return get_by_id(conn, user_id)
    assignments = sql.SQL(", ").join(
        sql.SQL("{} = %s").format(sql.Identifier(name)) for name in fields
    )
    query = sql.SQL(
        "UPDATE users SET {} WHERE id = %s "
        "RETURNING id, email, full_name, role, phone, address, is_active, created_at"
    ).format(assignments)
    return conn.execute(query, (*fields.values(), user_id)).fetchone()


def list_page(
    conn: Connection, *, role: str | None, q: str | None, limit: int, offset: int
) -> tuple[list[dict], int]:
    """One page of users ordered by id, and the number of users that match the filters."""
    conditions: list[sql.Composable] = []
    params: dict[str, object] = {"limit": limit, "offset": offset}
    if role is not None:
        conditions.append(sql.SQL("role = %(role)s"))
        params["role"] = role
    if q:
        conditions.append(sql.SQL("(email ILIKE %(pattern)s OR full_name ILIKE %(pattern)s)"))
        params["pattern"] = "%" + _escape_like(q) + "%"
    where = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(conditions) if conditions else sql.SQL("")

    count_row = conn.execute(
        sql.SQL("SELECT count(*) AS total FROM users") + where, params
    ).fetchone()
    rows = conn.execute(
        sql.SQL(
            "SELECT id, email, full_name, role, phone, address, is_active, created_at FROM users"
        )
        + where
        + sql.SQL(" ORDER BY id LIMIT %(limit)s OFFSET %(offset)s"),
        params,
    ).fetchall()
    return rows, count_row["total"]


def count_active_admins(conn: Connection) -> int:
    row = conn.execute(
        "SELECT count(*) AS total FROM users WHERE role = 'admin' AND is_active"
    ).fetchone()
    return row["total"]


def lock_active_admins(conn: Connection) -> None:
    """Lock every active admin row until the transaction ends. Call it inside conn.transaction()."""
    conn.execute(
        "SELECT id FROM users WHERE role = 'admin' AND is_active ORDER BY id FOR UPDATE"
    ).fetchall()
