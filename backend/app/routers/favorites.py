"""A customer's favourite products (see docs/api.md)."""

from fastapi import APIRouter, Depends

from app.deps import Conn, CurrentUser, Pagination, require_admin
from app.errors import ApiError
from app.repositories import favorites as repo
from app.repositories import products
from app.routers.products import list_item
from app.schemas.common import Page
from app.schemas.favorites import FavoriteIdsOut
from app.schemas.products import ProductListItem

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/me/favorites", response_model=Page[ProductListItem])
def list_favorites(conn: Conn, user: CurrentUser, p: Pagination) -> dict:
    rows, total = products.list_favorites(conn, user["id"], p.limit, p.offset)
    return p.page_of([list_item(row) for row in rows], total)


# Declared before the /{product_id} routes so that "ids" is never read as a product id.
@router.get("/me/favorites/ids", response_model=FavoriteIdsOut)
def list_favorite_ids(conn: Conn, user: CurrentUser) -> dict:
    return {"ids": repo.ids_for_user(conn, user["id"])}


@router.put("/me/favorites/{product_id}", status_code=204)
def add_favorite(product_id: int, conn: Conn, user: CurrentUser) -> None:
    if not repo.add(conn, user["id"], product_id):
        raise ApiError(404, "not_found")


@router.delete("/me/favorites/{product_id}", status_code=204)
def remove_favorite(product_id: int, conn: Conn, user: CurrentUser) -> None:
    repo.remove(conn, user["id"], product_id)
