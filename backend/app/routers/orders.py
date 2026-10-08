from fastapi import APIRouter, Depends

from app.deps import AdminUser, Conn, CurrentUser, Pagination, require_admin
from app.errors import ApiError
from app.repositories import orders as repo
from app.schemas.common import Page
from app.schemas.orders import (
    AdminOrderListItem,
    AdminOrderOut,
    AdminOrderUpdateIn,
    OrderCreateIn,
    OrderListItem,
    OrderOut,
    OrderStatus,
)
from app.services import orders as service

# Customer endpoints, mounted at /api.
router = APIRouter()
# Admin endpoints, mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.post("/orders", response_model=OrderOut, status_code=201)
def place_order(body: OrderCreateIn, conn: Conn, user: CurrentUser) -> dict:
    return service.place_order(conn, user["id"], body.ship_name, body.ship_phone, body.ship_address)


@router.get("/orders", response_model=Page[OrderListItem])
def list_my_orders(conn: Conn, user: CurrentUser, p: Pagination) -> dict:
    rows, total = repo.list_for_user(conn, user["id"], limit=p.limit, offset=p.offset)
    return {"items": rows, "total": total, "page": p.page, "page_size": p.page_size}


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_my_order(order_id: int, conn: Conn, user: CurrentUser) -> dict:
    order = repo.get_with_items(conn, order_id, user["id"])
    if order is None:
        raise ApiError(404, "not_found")
    return order


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel_my_order(order_id: int, conn: Conn, user: CurrentUser) -> dict:
    return service.cancel_own_order(conn, user["id"], order_id)


@admin_router.get("/orders", response_model=Page[AdminOrderListItem])
def list_orders(
    conn: Conn, _admin: AdminUser, p: Pagination, status: OrderStatus | None = None
) -> dict:
    rows, total = repo.list_admin(conn, status=status, limit=p.limit, offset=p.offset)
    return {"items": rows, "total": total, "page": p.page, "page_size": p.page_size}


@admin_router.get("/orders/{order_id}", response_model=AdminOrderOut)
def get_order(order_id: int, conn: Conn, _admin: AdminUser) -> dict:
    order = repo.get_with_items(conn, order_id)
    if order is None:
        raise ApiError(404, "not_found")
    return order


@admin_router.patch("/orders/{order_id}", response_model=AdminOrderOut)
def update_order(order_id: int, body: AdminOrderUpdateIn, conn: Conn, _admin: AdminUser) -> dict:
    return service.admin_update_order(conn, order_id, body.model_dump(exclude_unset=True))
