"""Cart rules: stock and line limits, and the cart view with its total."""

from decimal import Decimal

import psycopg
from psycopg import errors

from app.errors import ApiError
from app.media import card_image_url
from app.repositories import cart as repo

# A cart line never holds more than this, matching the quantity limit of the cart schemas.
MAX_LINE_QUANTITY = 99


def get_cart(conn: psycopg.Connection, user_id: int) -> dict:
    """The user's lines in product id order. Lines of inactive products stay listed."""
    items: list[dict] = []
    total = Decimal("0.00")
    for line in repo.lines(conn, user_id):
        line_total = line["unit_price"] * line["quantity"]
        total += line_total
        items.append(
            {
                "product_id": line["product_id"],
                "name": line["name"],
                "unit_price": line["unit_price"],
                "quantity": line["quantity"],
                "line_total": line_total,
                "stock": line["stock"],
                "available": line["available"],
                "image_url": card_image_url(line["file_name"], line["thumb_name"]),
            }
        )
    return {"items": items, "total": total}


def _active_product(conn: psycopg.Connection, user_id: int, product_id: int) -> dict:
    """The product when it exists and is active. A missing or inactive product is a 404."""
    product = repo.product_for_cart(conn, user_id, product_id)
    if product is None or not product["is_active"]:
        raise ApiError(404, "not_found")
    return product


def _check_stock(product: dict, product_id: int, quantity: int) -> None:
    """The resulting line quantity may not exceed the stock or the per-line limit."""
    if quantity > min(product["stock"], MAX_LINE_QUANTITY):
        raise ApiError(409, "insufficient_stock", product_id=product_id)


def add_item(conn: psycopg.Connection, user_id: int, product_id: int, quantity: int) -> dict:
    """Add to the current quantity of the line."""
    product = _active_product(conn, user_id, product_id)
    _check_stock(product, product_id, product["cart_quantity"] + quantity)
    try:
        repo.add_quantity(conn, user_id, product_id, quantity)
    except errors.CheckViolation:
        # A concurrent add pushed the line past the limit after our check; checkout re-checks
        # the stock atomically, so the only thing left to do here is to refuse this request.
        raise ApiError(409, "insufficient_stock", product_id=product_id) from None
    return get_cart(conn, user_id)


def set_item(conn: psycopg.Connection, user_id: int, product_id: int, quantity: int) -> dict:
    """Set the quantity of the line."""
    product = _active_product(conn, user_id, product_id)
    _check_stock(product, product_id, quantity)
    repo.set_quantity(conn, user_id, product_id, quantity)
    return get_cart(conn, user_id)


def remove_item(conn: psycopg.Connection, user_id: int, product_id: int) -> dict:
    """Delete the line. Deleting a line that does not exist is fine."""
    repo.remove(conn, user_id, product_id)
    return get_cart(conn, user_id)
