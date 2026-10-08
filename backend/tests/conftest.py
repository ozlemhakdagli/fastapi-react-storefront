"""Shared test fixtures (contract section 8).

Tests that need the database use the throwaway database ``ecommerce_test_<TEST_DB_SUFFIX>``
(default suffix ``main``). It is created on first use, migrated, and emptied after every test.
Tests that never request a database fixture (the unit tests) do not connect to PostgreSQL.
"""

import itertools
import os
import re
from collections.abc import Callable, Iterator
from decimal import Decimal
from pathlib import Path

import psycopg
import pytest
from dotenv import dotenv_values
from fastapi.testclient import TestClient
from psycopg import sql
from psycopg.conninfo import make_conninfo
from psycopg_pool import ConnectionPool

from app.config import Settings, get_settings
from app.db import create_pool
from app.migrate import apply_migrations
from app.security import create_access_token, hash_password

TEST_SECRET_KEY = "test-secret-key-0123456789-abcdefghijklmnopqrstuvwxyz"
BACKEND_DIR = Path(__file__).resolve().parent.parent

_counter = itertools.count(1)


def _base_dsn() -> str | None:
    """The development DSN (environment, then backend/.env); only the database name changes."""
    return (
        os.environ.get("TEST_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or dotenv_values(BACKEND_DIR / ".env").get("DATABASE_URL")
    )


def _test_db_name() -> str:
    suffix = os.environ.get("TEST_DB_SUFFIX", "main")
    if not re.fullmatch(r"[a-z0-9_]+", suffix):
        raise RuntimeError("TEST_DB_SUFFIX may contain only a-z, 0-9 and _")
    return f"ecommerce_test_{suffix}"


def _test_dsn_string() -> str | None:
    base = _base_dsn()
    return make_conninfo(base, dbname=_test_db_name()) if base else None


@pytest.fixture(scope="session", autouse=True)
def _test_environment(tmp_path_factory: pytest.TempPathFactory) -> Iterator[None]:
    """Point the settings at the test database and a temporary upload folder."""
    with pytest.MonkeyPatch.context() as patch:
        patch.setenv("SECRET_KEY", TEST_SECRET_KEY)
        patch.setenv("CORS_ORIGINS", "http://localhost:5173")
        patch.setenv("UPLOAD_DIR", str(tmp_path_factory.mktemp("uploads")))
        dsn = _test_dsn_string()
        if dsn:
            patch.setenv("DATABASE_URL", dsn)
        yield


@pytest.fixture(autouse=True)
def _fresh_settings_cache() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(scope="session")
def test_dsn() -> str:
    """Create the test database if missing and apply the migrations."""
    base = _base_dsn()
    if not base:
        pytest.fail("DATABASE_URL is not set (export it or create backend/.env)")
    name = _test_db_name()
    with psycopg.connect(make_conninfo(base, dbname="postgres"), autocommit=True) as admin:
        exists = admin.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,)).fetchone()
        if not exists:
            admin.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
    dsn = make_conninfo(base, dbname=name)
    apply_migrations(dsn)
    return dsn


@pytest.fixture(autouse=True)
def _empty_tables_after_test(request: pytest.FixtureRequest) -> Iterator[None]:
    yield
    if "test_dsn" not in request.fixturenames:
        return
    with psycopg.connect(request.getfixturevalue("test_dsn"), autocommit=True) as conn:
        names = [
            row[0]
            for row in conn.execute(
                "SELECT tablename FROM pg_tables "
                "WHERE schemaname = 'public' AND tablename <> 'schema_migrations'"
            )
        ]
        if names:
            conn.execute(
                sql.SQL("TRUNCATE {} RESTART IDENTITY CASCADE").format(
                    sql.SQL(", ").join(sql.Identifier(name) for name in names)
                )
            )


@pytest.fixture
def settings(test_dsn: str) -> Settings:
    return get_settings()


@pytest.fixture(scope="session")
def pool(test_dsn: str) -> Iterator[ConnectionPool]:
    pool = create_pool(test_dsn, min_size=1, max_size=5)
    pool.open(wait=True)
    yield pool
    pool.close()


@pytest.fixture
def conn(pool: ConnectionPool) -> Iterator[psycopg.Connection]:
    """A pooled connection: autocommit on, rows as dicts."""
    with pool.connection() as connection:
        yield connection


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    from app.main import create_app  # imported late so unit tests never load the app

    with TestClient(create_app(settings)) as test_client:
        yield test_client


# --- factories: each returns the inserted row as a dict ------------------------------------


@pytest.fixture
def make_user(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(
        *,
        email: str | None = None,
        role: str = "customer",
        password: str = "Passw0rd!x",
        is_active: bool = True,
        full_name: str = "Test User",
    ) -> dict:
        n = next(_counter)
        row = conn.execute(
            "INSERT INTO users (email, full_name, password_hash, role, is_active) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING *",
            (email or f"user{n}@example.com", full_name, hash_password(password), role, is_active),
        ).fetchone()
        assert row is not None
        return {**row, "password": password}

    return factory


def _insert_named(conn: psycopg.Connection, table: str, name: str | None, prefix: str) -> dict:
    query = sql.SQL("INSERT INTO {} (name) VALUES (%s) RETURNING *").format(sql.Identifier(table))
    row = conn.execute(query, (name or f"{prefix} {next(_counter)}",)).fetchone()
    assert row is not None
    return row


@pytest.fixture
def make_category(conn: psycopg.Connection) -> Callable[..., dict]:
    return lambda name=None: _insert_named(conn, "categories", name, "Category")


@pytest.fixture
def make_brand(conn: psycopg.Connection) -> Callable[..., dict]:
    return lambda name=None: _insert_named(conn, "brands", name, "Brand")


@pytest.fixture
def make_product(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(
        *,
        price: str = "100.00",
        stock: int = 10,
        is_active: bool = True,
        is_new: bool = False,
        category_id: int | None = None,
        brand_id: int | None = None,
        sku: str | None = None,
        name: str | None = None,
        cost_price: str | None = None,
    ) -> dict:
        n = next(_counter)
        row = conn.execute(
            "INSERT INTO products (sku, name, brand_id, category_id, price, cost_price, stock, "
            "is_new, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (
                sku or f"SKU-{n}",
                name or f"Product {n}",
                brand_id,
                category_id,
                price,
                cost_price,
                stock,
                is_new,
                is_active,
            ),
        ).fetchone()
        assert row is not None
        return row

    return factory


@pytest.fixture
def make_image(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(product_id: int, file_name: str = "placeholder.svg", position: int = 0) -> dict:
        row = conn.execute(
            "INSERT INTO product_images (product_id, file_name, position) "
            "VALUES (%s, %s, %s) RETURNING *",
            (product_id, file_name, position),
        ).fetchone()
        assert row is not None
        return row

    return factory


@pytest.fixture
def make_cart_item(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(user_id: int, product_id: int, quantity: int = 1) -> dict:
        row = conn.execute(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, %s) "
            "RETURNING *",
            (user_id, product_id, quantity),
        ).fetchone()
        assert row is not None
        return row

    return factory


@pytest.fixture
def make_order(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(
        user_id: int,
        *,
        status: str = "new",
        items: tuple[tuple[int, int], ...] = (),
    ) -> dict:
        """Insert an order and its items. Stock is not touched. Returns the order plus `items`."""
        lines = []
        for product_id, quantity in items:
            product = conn.execute(
                "SELECT name, price FROM products WHERE id = %s", (product_id,)
            ).fetchone()
            assert product is not None, f"unknown product {product_id}"
            lines.append((product_id, product["name"], product["price"], quantity))
        total = sum((price * quantity for _, _, price, quantity in lines), Decimal("0.00"))
        order = conn.execute(
            "INSERT INTO orders (user_id, status, total, ship_name, ship_phone, ship_address) "
            "VALUES (%s, %s, %s, 'Test User', '5550000000', 'Test Street 1') RETURNING *",
            (user_id, status, total),
        ).fetchone()
        assert order is not None
        inserted = []
        for product_id, name, price, quantity in lines:
            line = conn.execute(
                "INSERT INTO order_items (order_id, product_id, product_name, unit_price, "
                "quantity, line_total) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                (order["id"], product_id, name, price, quantity, price * quantity),
            ).fetchone()
            inserted.append(line)
        return {**order, "items": inserted}

    return factory


@pytest.fixture
def make_comment(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(product_id: int, user_id: int, body: str = "Nice") -> dict:
        row = conn.execute(
            "INSERT INTO comments (product_id, user_id, body) VALUES (%s, %s, %s) RETURNING *",
            (product_id, user_id, body),
        ).fetchone()
        assert row is not None
        return row

    return factory


@pytest.fixture
def make_message(conn: psycopg.Connection) -> Callable[..., dict]:
    def factory(
        *,
        direction: str = "inbound",
        user_id: int | None = None,
        status: str = "new",
        subject: str = "Hello",
        body: str = "Body",
    ) -> dict:
        n = next(_counter)
        row = conn.execute(
            "INSERT INTO messages (direction, user_id, name, email, subject, body, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (direction, user_id, "Visitor", f"visitor{n}@example.com", subject, body, status),
        ).fetchone()
        assert row is not None
        return row

    return factory


@pytest.fixture
def auth_headers() -> Callable[[dict], dict[str, str]]:
    def factory(user: dict) -> dict[str, str]:
        return {"Authorization": f"Bearer {create_access_token(user['id'])}"}

    return factory


@pytest.fixture
def admin_headers(
    make_user: Callable[..., dict], auth_headers: Callable[[dict], dict[str, str]]
) -> Callable[[], dict[str, str]]:
    def factory() -> dict[str, str]:
        return auth_headers(make_user(role="admin"))

    return factory
