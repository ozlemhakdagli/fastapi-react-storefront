from fastapi import APIRouter, Depends, Response

from app.deps import Conn, CurrentUser, Pagination, require_admin
from app.errors import ApiError
from app.repositories import comments as repo
from app.schemas.comments import AdminCommentOut, CommentIn, CommentOut, MyCommentOut
from app.schemas.common import Page

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/products/{product_id}/comments", response_model=Page[CommentOut])
def list_product_comments(product_id: int, conn: Conn, p: Pagination) -> dict:
    # A missing or inactive product has no public comments, just like the product itself.
    if not repo.product_is_active(conn, product_id):
        raise ApiError(404, "not_found")
    items = repo.list_for_product(conn, product_id, p.limit, p.offset)
    total = repo.count_for_product(conn, product_id)
    return p.page_of(items, total)


@router.post("/products/{product_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(product_id: int, body: CommentIn, conn: Conn, user: CurrentUser) -> dict:
    comment = repo.create(conn, product_id, user["id"], body.body)
    if comment is None:
        raise ApiError(404, "not_found")
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, conn: Conn, user: CurrentUser) -> Response:
    comment = repo.get(conn, comment_id)
    # Another user's comment answers like a missing one, so the caller learns nothing about it.
    if comment is None or (comment["user_id"] != user["id"] and user["role"] != "admin"):
        raise ApiError(404, "not_found")
    if repo.delete(conn, comment_id) is None:
        raise ApiError(404, "not_found")
    return Response(status_code=204)


@router.get("/me/comments", response_model=Page[MyCommentOut])
def list_my_comments(conn: Conn, user: CurrentUser, p: Pagination) -> dict:
    items = repo.list_for_user(conn, user["id"], p.limit, p.offset)
    total = repo.count_for_user(conn, user["id"])
    return p.page_of(items, total)


@admin_router.get("/comments", response_model=Page[AdminCommentOut])
def list_all_comments(conn: Conn, p: Pagination) -> dict:
    items = repo.list_admin(conn, p.limit, p.offset)
    total = repo.count_admin(conn)
    return p.page_of(items, total)
