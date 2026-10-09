"""Star ratings of products (see docs/api.md)."""

from fastapi import APIRouter, Depends

from app.deps import Conn, CurrentUser, require_admin
from app.errors import ApiError
from app.repositories import comments, ratings
from app.schemas.ratings import RatingIn, RatingOut

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/me/ratings/{product_id}", response_model=RatingOut)
def get_my_rating(product_id: int, conn: Conn, user: CurrentUser) -> dict:
    if not comments.product_is_active(conn, product_id):
        raise ApiError(404, "not_found")
    return {
        "rating": ratings.get(conn, user["id"], product_id),
        "can_rate": ratings.has_purchased(conn, user["id"], product_id),
    }


@router.put("/me/ratings/{product_id}", response_model=RatingOut)
def set_my_rating(product_id: int, body: RatingIn, conn: Conn, user: CurrentUser) -> dict:
    rating = ratings.set_rating(conn, user["id"], product_id, body.rating)
    if rating is None:
        # Nothing was written: the product is missing or inactive, or no completed order holds it.
        if not comments.product_is_active(conn, product_id):
            raise ApiError(404, "not_found")
        raise ApiError(403, "purchase_required")
    return {"rating": rating, "can_rate": True}


@router.delete("/me/ratings/{product_id}", status_code=204)
def remove_my_rating(product_id: int, conn: Conn, user: CurrentUser) -> None:
    ratings.remove(conn, user["id"], product_id)
