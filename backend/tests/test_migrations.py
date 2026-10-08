"""Tests for the migration runner and the initial schema.

Each test runs against its own throwaway database, ecommerce_test_t2_<uuid>. It is
created through the `postgres` maintenance database and dropped after the test.
"""

import os
import shutil
import time
import uuid
from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from psycopg import errors, sql
from psycopg.conninfo import make_conninfo

from app.migrate import DEFAULT_DIR, MigrationError, apply_migrations, main

EXPECTED_TABLES = {
    "users",
    "categories",
    "brands",
    "products",
    "product_images",
    "cart_items",
    "orders",
    "order_items",
    "comments",
    "messages",
    "site_settings",
    "schema_migrations",
}


@pytest.fixture
def db_dsn() -> Iterator[str]:
    base_dsn = os.environ["DATABASE_URL"]
    maintenance_dsn = make_conninfo(base_dsn, dbname="postgres")
    name = f"ecommerce_test_t2_{uuid.uuid4().hex}"
    with psycopg.connect(maintenance_dsn, autocommit=True) as conn:
        conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
    try:
        yield make_conninfo(base_dsn, dbname=name)
    finally:
        _drop_database(maintenance_dsn, name)


def _drop_database(maintenance_dsn: str, name: str) -> None:
    """Drop a throwaway database. WITH (FORCE) can briefly fail for a role that is not a
    superuser while a server background worker (autovacuum) is still attached, so retry."""
    statement = sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(sql.Identifier(name))
    for attempt in range(10):
        try:
            with psycopg.connect(maintenance_dsn, autocommit=True) as conn:
                conn.execute(statement)
            return
        except errors.InsufficientPrivilege:
            if attempt == 9:
                raise
            time.sleep(0.3)


def _query(dsn: str, query: str) -> list[tuple]:
    with psycopg.connect(dsn, autocommit=True) as conn:
        return conn.execute(query).fetchall()


def test_applies_all_migrations_to_empty_database(db_dsn: str) -> None:
    assert apply_migrations(db_dsn) == ["0001_init"]
    rows = _query(db_dsn, "SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    assert EXPECTED_TABLES <= {row[0] for row in rows}


def test_second_run_is_a_noop(db_dsn: str) -> None:
    apply_migrations(db_dsn)
    assert apply_migrations(db_dsn) == []
    assert _query(db_dsn, "SELECT count(*) FROM schema_migrations") == [(1,)]


def test_checksum_change_raises(db_dsn: str, tmp_path: Path) -> None:
    migrations = tmp_path / "migrations"
    shutil.copytree(DEFAULT_DIR, migrations)
    apply_migrations(db_dsn, migrations)
    init_file = migrations / "0001_init.sql"
    init_file.write_text(init_file.read_text() + "\n-- edited after apply\n")
    with pytest.raises(MigrationError):
        apply_migrations(db_dsn, migrations)


def test_failed_migration_rolls_back(db_dsn: str, tmp_path: Path) -> None:
    migrations = tmp_path / "migrations"
    migrations.mkdir()
    (migrations / "0001_a.sql").write_text("CREATE TABLE t0 (id int);\n")
    (migrations / "0002_b.sql").write_text(
        "CREATE TABLE t1 (id int); SELECT broken_column FROM nope;\n"
    )
    with pytest.raises(MigrationError):
        apply_migrations(db_dsn, migrations)
    assert _query(db_dsn, "SELECT to_regclass('t1')") == [(None,)]
    versions = {row[0] for row in _query(db_dsn, "SELECT version FROM schema_migrations")}
    assert "0002_b" not in versions
    assert "0001_a" in versions


def test_rejects_bad_file_name(db_dsn: str, tmp_path: Path) -> None:
    migrations = tmp_path / "migrations"
    migrations.mkdir()
    (migrations / "init.sql").write_text("SELECT 1;\n")
    with pytest.raises(MigrationError):
        apply_migrations(db_dsn, migrations)


def test_schema_constraints(db_dsn: str) -> None:
    apply_migrations(db_dsn)
    with psycopg.connect(db_dsn, autocommit=True) as conn:
        with pytest.raises(errors.CheckViolation):
            conn.execute(
                "INSERT INTO products (sku, name, price, stock) VALUES ('NEG', 'Negative', 1, -1)"
            )

        conn.execute(
            "INSERT INTO users (email, full_name, password_hash) VALUES ('A@x.com', 'A', 'h')"
        )
        with pytest.raises(errors.UniqueViolation):
            conn.execute(
                "INSERT INTO users (email, full_name, password_hash) VALUES ('a@x.com', 'B', 'h')"
            )

        with pytest.raises(errors.CheckViolation):
            conn.execute(
                "INSERT INTO messages (direction, name, email, subject, body) "
                "VALUES ('outbound', 'Shop', 'shop@x.com', 'Hi', 'Body')"
            )

        with pytest.raises(errors.CheckViolation):
            conn.execute("INSERT INTO site_settings (id) VALUES (2)")

        product_id = conn.execute(
            "INSERT INTO products (sku, name, price) VALUES ('SKU-1', 'Product', 10) RETURNING id"
        ).fetchone()[0]
        user_id = conn.execute("SELECT id FROM users WHERE email = 'A@x.com'").fetchone()[0]
        order_id = conn.execute(
            "INSERT INTO orders (user_id, total, ship_name, ship_phone, ship_address) "
            "VALUES (%s, 10, 'A', '555', 'Addr') RETURNING id",
            (user_id,),
        ).fetchone()[0]
        conn.execute(
            "INSERT INTO order_items "
            "(order_id, product_id, product_name, unit_price, quantity, line_total) "
            "VALUES (%s, %s, 'Product', 10, 1, 10)",
            (order_id, product_id),
        )
        # ON DELETE RESTRICT raises restrict_violation (SQLSTATE 23001), not 23503.
        with pytest.raises(errors.RestrictViolation):
            conn.execute("DELETE FROM products WHERE id = %s", (product_id,))

        conn.execute(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, 1)",
            (user_id, product_id),
        )
        with pytest.raises(errors.UniqueViolation):
            conn.execute(
                "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, 2)",
                (user_id, product_id),
            )

        first = conn.execute(
            "INSERT INTO product_images (product_id, file_name, position) "
            "VALUES (%s, 'a.jpg', 0) RETURNING id",
            (product_id,),
        ).fetchone()[0]
        second = conn.execute(
            "INSERT INTO product_images (product_id, file_name, position) "
            "VALUES (%s, 'b.jpg', 1) RETURNING id",
            (product_id,),
        ).fetchone()[0]
        with conn.transaction():
            conn.execute("UPDATE product_images SET position = 1 WHERE id = %s", (first,))
            conn.execute("UPDATE product_images SET position = 0 WHERE id = %s", (second,))
        positions = dict(conn.execute("SELECT id, position FROM product_images").fetchall())
    assert positions == {first: 1, second: 0}


def test_main_applies_pending_migrations_and_prints_them(
    db_dsn: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("DATABASE_URL", db_dsn)
    main()
    assert capsys.readouterr().out == "applied 0001_init\n"
    main()
    assert capsys.readouterr().out == ""


def test_main_without_database_url_exits(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(SystemExit):
        main()
