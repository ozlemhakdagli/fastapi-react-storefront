"""Cart endpoints: the logged-in customer's lines, stock limits and totals."""

from fastapi import APIRouter, Depends

from app.deps import Conn, CurrentUser, require_admin
from app.schemas.cart import CartItemIn, CartItemSetIn, CartOut
from app.services import cart as service

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/cart", response_model=CartOut)
def get_cart(conn: Conn, user: CurrentUser) -> dict:
    return service.get_cart(conn, user["id"])


@router.post("/cart/items", response_model=CartOut)
def add_item(body: CartItemIn, conn: Conn, user: CurrentUser) -> dict:
    return service.add_item(conn, user["id"], body.product_id, body.quantity)


@router.put("/cart/items/{product_id}", response_model=CartOut)
def set_item(product_id: int, body: CartItemSetIn, conn: Conn, user: CurrentUser) -> dict:
    return service.set_item(conn, user["id"], product_id, body.quantity)


@router.delete("/cart/items/{product_id}", response_model=CartOut)
def remove_item(product_id: int, conn: Conn, user: CurrentUser) -> dict:
    return service.remove_item(conn, user["id"], product_id)
