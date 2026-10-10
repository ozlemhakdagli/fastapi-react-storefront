"""Two buyers racing for the last item, and one buyer double-submitting."""

import threading
from concurrent.futures import ThreadPoolExecutor

from app.errors import ApiError
from app.services.orders import place_order


def _race(pool, user_ids: list[int]) -> list[str]:
    """Run place_order for each user at the same moment on its own pooled connection."""
    barrier = threading.Barrier(len(user_ids))

    def attempt(user_id: int) -> str:
        with pool.connection() as connection:
            barrier.wait(timeout=10)
            try:
                place_order(connection, user_id, "Jane", "+1 555 010 0100", "12 Example Street")
            except ApiError as error:
                return error.code
            return "ok"

    with ThreadPoolExecutor(max_workers=len(user_ids)) as executor:
        return sorted(executor.map(attempt, user_ids))


def test_last_item_is_sold_exactly_once(
    pool, conn, make_user, make_product, make_cart_item
) -> None:
    product = make_product(stock=1)
    first, second = make_user(), make_user()
    make_cart_item(first["id"], product["id"], 1)
    make_cart_item(second["id"], product["id"], 1)

    outcomes = _race(pool, [first["id"], second["id"]])

    assert outcomes == ["insufficient_stock", "ok"]
    assert conn.execute("SELECT stock FROM products").fetchone()["stock"] == 0
    assert conn.execute("SELECT count(*) AS n FROM orders").fetchone()["n"] == 1
    assert conn.execute("SELECT count(*) AS n FROM order_items").fetchone()["n"] == 1


def test_double_submit_by_one_buyer_creates_one_order(
    pool, conn, make_user, make_product, make_cart_item
) -> None:
    product = make_product(stock=5)
    buyer = make_user()
    make_cart_item(buyer["id"], product["id"], 2)

    outcomes = _race(pool, [buyer["id"], buyer["id"]])

    assert outcomes == ["empty_cart", "ok"]
    assert conn.execute("SELECT stock FROM products").fetchone()["stock"] == 3
    assert conn.execute("SELECT count(*) AS n FROM orders").fetchone()["n"] == 1


def test_orders_with_crossed_product_order_do_not_deadlock(
    pool, conn, make_user, make_product, make_cart_item
) -> None:
    first_product, second_product = make_product(stock=10), make_product(stock=10)
    alice, bob = make_user(), make_user()
    # Both carts hold both products; lines are processed in product id order for everyone.
    for user in (alice, bob):
        make_cart_item(user["id"], second_product["id"], 1)
        make_cart_item(user["id"], first_product["id"], 1)

    assert _race(pool, [alice["id"], bob["id"]]) == ["ok", "ok"]
    stocks = conn.execute("SELECT stock FROM products ORDER BY id").fetchall()
    assert [row["stock"] for row in stocks] == [8, 8]
