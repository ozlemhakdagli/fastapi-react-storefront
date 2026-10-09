"""Order rules: placing an order, the status machine and stock handling."""

from decimal import Decimal

import psycopg

from app.errors import ApiError
from app.repositories import orders as repo
from app.repositories import products

# The order status machine (docs/api.md).
ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    "new": frozenset({"approved", "rejected", "cancelled"}),
    "approved": frozenset({"shipped", "cancelled"}),
    "shipped": frozenset({"completed"}),
    "completed": frozenset(),
    "rejected": frozenset(),
    "cancelled": frozenset(),
}

# Entering one of these statuses returns the ordered quantities to stock.
_RESTOCKING = frozenset({"rejected", "cancelled"})


def place_order(
    conn: psycopg.Connection, user_id: int, ship_name: str, ship_phone: str, ship_address: str
) -> dict:
    """Turn the user's cart into an order in one transaction.

    Cart lines are locked and processed in product id order, so concurrent checkouts never
    deadlock and a double submit sees an empty cart. Prices come from the database row that
    the stock UPDATE returns, never from the client.
    """
    with conn.transaction():
        lines = repo.cart_lines_for_update(conn, user_id)
        if not lines:
            raise ApiError(400, "empty_cart")

        priced = []
        for line in lines:
            product = repo.decrement_stock(conn, line["product_id"], line["quantity"])
            if product is None:
                if products.is_active(conn, line["product_id"]) is False:
                    raise ApiError(409, "product_unavailable", product_id=line["product_id"])
                raise ApiError(409, "insufficient_stock", product_id=line["product_id"])
            priced.append((line, product))

        total = sum((p["price"] * line["quantity"] for line, p in priced), Decimal("0.00"))
        order = repo.insert_order(
            conn,
            user_id=user_id,
            total=total,
            ship_name=ship_name,
            ship_phone=ship_phone,
            ship_address=ship_address,
        )
        for line, product in priced:
            repo.insert_item(
                conn,
                order_id=order["id"],
                product_id=line["product_id"],
                product_name=product["name"],
                unit_price=product["price"],
                quantity=line["quantity"],
            )
        repo.clear_cart(conn, user_id)

    return repo.required(repo.get_with_items(conn, order["id"]))


def _apply_status(conn: psycopg.Connection, order: dict, new_status: str) -> None:
    """Move a locked order to `new_status` following the machine. The same status is a no-op."""
    current = order["status"]
    if new_status == current:
        return
    if new_status not in ALLOWED_TRANSITIONS[current]:
        raise ApiError(409, "invalid_status_transition")
    if new_status in _RESTOCKING:
        repo.add_stock_back(conn, order["id"])
    repo.update_fields(conn, order["id"], {"status": new_status})


def admin_update_order(conn: psycopg.Connection, order_id: int, fields: dict) -> dict:
    """Apply an admin PATCH (status, cargo company, tracking number, note) atomically."""
    with conn.transaction():
        order = repo.get_for_update(conn, order_id)
        if order is None:
            raise ApiError(404, "not_found")
        if "status" in fields:
            _apply_status(conn, order, fields["status"])
        plain = {name: value for name, value in fields.items() if name != "status"}
        if plain:
            repo.update_fields(conn, order_id, plain)
    return repo.required(repo.get_with_items(conn, order_id))


def cancel_own_order(conn: psycopg.Connection, user_id: int, order_id: int) -> dict:
    """A customer cancels their own order, allowed only while it is still new."""
    with conn.transaction():
        order = repo.get_for_update(conn, order_id, user_id)
        if order is None:
            raise ApiError(404, "not_found")
        if order["status"] != "new":
            raise ApiError(409, "invalid_status_transition")
        _apply_status(conn, order, "cancelled")
    return repo.required(repo.get_with_items(conn, order_id, user_id))
