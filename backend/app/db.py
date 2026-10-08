"""Connection pool and the per-request connection dependency."""

from collections.abc import Iterator

import psycopg
from fastapi import Request
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


def create_pool(dsn: str, *, min_size: int = 1, max_size: int = 10) -> ConnectionPool:
    """Return an unopened pool. The application opens it in its lifespan handler."""
    return ConnectionPool(
        dsn,
        min_size=min_size,
        max_size=max_size,
        kwargs={"autocommit": True, "row_factory": dict_row},
        open=False,
    )


def get_conn(request: Request) -> Iterator[psycopg.Connection]:
    """FastAPI dependency: borrow one pooled connection for the duration of a request."""
    with request.app.state.pool.connection() as conn:
        yield conn
