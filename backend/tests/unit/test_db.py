"""The connection pool and the connection dependency."""

from unittest.mock import Mock

import pytest

from app.db import create_pool, get_conn


def test_every_pooled_connection_cancels_a_statement_after_fifteen_seconds(test_dsn: str) -> None:
    """One slow query must not hold a pooled connection for ever."""
    pool = create_pool(test_dsn, min_size=1, max_size=2)
    pool.open(wait=True)
    try:
        with pool.connection() as conn:
            row = conn.execute("SHOW statement_timeout").fetchone()
    finally:
        pool.close()
    assert row == {"statement_timeout": "15s"}


def test_get_conn_hands_out_a_working_connection_and_gives_it_back(pool) -> None:
    request = Mock()
    request.app.state.pool = pool

    gen = get_conn(request)
    conn = next(gen)
    assert conn.execute("SELECT 1 AS num").fetchone() == {"num": 1}
    with pytest.raises(StopIteration):
        next(gen)
