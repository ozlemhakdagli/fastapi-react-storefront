"""Cart endpoints: the logged-in customer's lines, stock limits and totals."""

from decimal import Decimal

import psycopg
from fastapi import APIRouter, Depends

from app.deps import Conn, CurrentUser, require_admin
from app.errors import ApiError
from app.media import image_url
from app.repositories import cart as cart_repo
from app.schemas.cart import CartItemIn, CartItemOut, CartItemSetIn, CartOut

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])

# A cart line never holds more than this, matching the quantity limit of the cart schemas.
MAX_LINE_QUANTITY = 99


def _cart_out(conn: psycopg.Connection, user_id: int) -> CartOut:
    items: list[CartItemOut] = []
    total = Decimal("0.00")
    for line in cart_repo.lines(conn, user_id):
        line_total = line["unit_price"] * line["quantity"]
        total += line_total
        items.append(
            CartItemOut(
                product_id=line["product_id"],
                name=line["name"],
                unit_price=line["unit_price"],
                quantity=line["quantity"],
                line_total=line_total,
                stock=line["stock"],
                image_url=image_url(line["file_name"]),
            )
        )
    return CartOut(items=items, total=total)


def _active_product(conn: psycopg.Connection, user_id: int, product_id: int) -> dict:
    """The product when it exists and is active. A missing or inactive product is a 404."""
    product = cart_repo.product_for_cart(conn, user_id, product_id)
    if product is None or not product["is_active"]:
        raise ApiError(404, "not_found")
    return product


def _check_stock(product: dict, product_id: int, quantity: int) -> None:
    """The resulting line quantity may not exceed the stock or the per-line limit."""
    if quantity > min(product["stock"], MAX_LINE_QUANTITY):
        raise ApiError(409, "insufficient_stock", product_id=product_id)


@router.get("/cart", response_model=CartOut)
def get_cart(conn: Conn, user: CurrentUser) -> CartOut:
    return _cart_out(conn, user["id"])


@router.post("/cart/items", response_model=CartOut)
def add_item(body: CartItemIn, conn: Conn, user: CurrentUser) -> CartOut:
    product = _active_product(conn, user["id"], body.product_id)
    _check_stock(product, body.product_id, product["cart_quantity"] + body.quantity)
    cart_repo.add_quantity(conn, user["id"], body.product_id, body.quantity)
    return _cart_out(conn, user["id"])


@router.put("/cart/items/{product_id}", response_model=CartOut)
def set_item(product_id: int, body: CartItemSetIn, conn: Conn, user: CurrentUser) -> CartOut:
    product = _active_product(conn, user["id"], product_id)
    _check_stock(product, product_id, body.quantity)
    cart_repo.set_quantity(conn, user["id"], product_id, body.quantity)
    return _cart_out(conn, user["id"])


@router.delete("/cart/items/{product_id}", response_model=CartOut)
def remove_item(product_id: int, conn: Conn, user: CurrentUser) -> CartOut:
    cart_repo.remove(conn, user["id"], product_id)
    return _cart_out(conn, user["id"])
