"""Applies the SQL files in backend/migrations in name order.

Each file runs in its own transaction together with its schema_migrations row. The row
stores the SHA-256 of the file bytes, so an applied file that later changes is an error.
"""

import hashlib
import os
import re
from pathlib import Path

import psycopg
from dotenv import dotenv_values

DEFAULT_DIR = Path(__file__).resolve().parent.parent / "migrations"

_LOCK_KEY = 8472913
_FILE_NAME = re.compile(r"[0-9]{4}_[a-z0-9_]+\.sql")
_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version    TEXT PRIMARY KEY,
    checksum   TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


class MigrationError(Exception):
    """A migration file is misnamed, changed after it was applied, or failed to run."""


def _load(migrations_dir: Path) -> list[tuple[str, str, str]]:
    """Return (version, sql, checksum) for each .sql file, in name order."""
    loaded = []
    for path in sorted(migrations_dir.glob("*.sql"), key=lambda p: p.name):
        if not _FILE_NAME.fullmatch(path.name):
            raise MigrationError(f"invalid migration file name: {path.name}")
        raw = path.read_bytes()
        loaded.append((path.stem, raw.decode("utf-8"), hashlib.sha256(raw).hexdigest()))
    return loaded


def apply_migrations(dsn: str, migrations_dir: Path = DEFAULT_DIR) -> list[str]:
    """Apply every migration that is not recorded yet and return the newly applied versions.

    The advisory lock is taken inside each transaction, and the recorded state is read
    under that lock. Concurrent runs therefore wait for each other and never apply a file
    twice.
    """
    migrations = _load(migrations_dir)
    newly_applied: list[str] = []
    with psycopg.connect(dsn, autocommit=True) as conn:
        for version, sql_text, checksum in migrations:
            with conn.transaction():
                conn.execute("SELECT pg_advisory_xact_lock(%s)", (_LOCK_KEY,))
                conn.execute(_CREATE_TABLE)
                row = conn.execute(
                    "SELECT checksum FROM schema_migrations WHERE version = %s", (version,)
                ).fetchone()
                if row is not None:
                    if row[0] != checksum:
                        raise MigrationError(f"{version} changed after it was applied")
                    continue
                try:
                    conn.execute(sql_text)
                except psycopg.Error as exc:
                    raise MigrationError(f"{version} failed: {exc}") from exc
                conn.execute(
                    "INSERT INTO schema_migrations (version, checksum) VALUES (%s, %s)",
                    (version, checksum),
                )
            newly_applied.append(version)
    return newly_applied


def main() -> None:
    """Apply pending migrations to the database named by DATABASE_URL (python -m app.migrate)."""
    # The environment wins; otherwise read the .env file of the current directory (backend/).
    dsn = os.environ.get("DATABASE_URL") or dotenv_values(".env").get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is not set (export it or put it in backend/.env)")
    for version in apply_migrations(dsn):
        print(f"applied {version}")


if __name__ == "__main__":
    main()
