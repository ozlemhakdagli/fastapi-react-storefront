"""Rules for accounts: registration, login, password changes and admin user management."""

from psycopg import Connection
from psycopg.errors import UniqueViolation

from app.errors import ApiError
from app.repositories import users
from app.schemas.auth import RegisterIn
from app.schemas.users import AdminUserCreateIn, AdminUserUpdateIn
from app.security import DUMMY_HASH, hash_password, verify_password


def register(conn: Connection, data: RegisterIn) -> dict:
    return _insert(
        conn,
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        role="customer",
        phone=data.phone,
        address=data.address,
    )


def authenticate(conn: Connection, email: str, password: str) -> dict:
    """Return the active user with this email and password, without its hash."""
    user = users.get_by_email(conn, email)
    if user is None or not user["is_active"]:
        # Spend one Argon2 check too, so that unknown or inactive accounts are not faster.
        verify_password(password, DUMMY_HASH)
        raise ApiError(401, "invalid_credentials")
    if not verify_password(password, user["password_hash"]):
        raise ApiError(401, "invalid_credentials")
    return {key: value for key, value in user.items() if key != "password_hash"}


def change_password(conn: Connection, user: dict, current: str, new: str) -> None:
    stored = users.get_password_hash(conn, user["id"])
    if stored is None:  # the account disappeared after the token was checked
        raise ApiError(401, "unauthorized")
    if not verify_password(current, stored):
        raise ApiError(400, "wrong_password")
    users.update(conn, user["id"], {"password_hash": hash_password(new)})


def admin_create_user(conn: Connection, data: AdminUserCreateIn) -> dict:
    return _insert(
        conn,
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        role=data.role,
        phone=data.phone,
        address=data.address,
    )


def admin_update_user(conn: Connection, user_id: int, data: AdminUserUpdateIn) -> dict:
    fields = data.model_dump(exclude_unset=True)
    if "password" in fields:
        fields["password_hash"] = hash_password(fields.pop("password"))
    with conn.transaction():
        if "role" in fields or "is_active" in fields:
            # Lock every active admin before reading the target. Two concurrent demotions then
            # cannot both see another admin and leave the site without one.
            users.lock_active_admins(conn)
        target = users.get_by_id(conn, user_id)
        if target is None:
            raise ApiError(404, "not_found")
        if _removes_active_admin(target, fields) and users.count_active_admins(conn) <= 1:
            raise ApiError(409, "last_admin")
        return users.update(conn, user_id, fields)


def _removes_active_admin(target: dict, fields: dict) -> bool:
    """True when the change turns an active admin into a customer or deactivates it."""
    if target["role"] != "admin" or not target["is_active"]:
        return False
    return fields.get("role") == "customer" or fields.get("is_active") is False


def _insert(
    conn: Connection,
    *,
    email: str,
    password: str,
    full_name: str,
    role: str,
    phone: str | None,
    address: str | None,
) -> dict:
    password_hash = hash_password(password)
    try:
        return users.create(
            conn,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
            phone=phone,
            address=address,
        )
    except UniqueViolation as exc:
        # The only unique constraint on users is the case-insensitive email index.
        raise ApiError(409, "email_taken") from exc
