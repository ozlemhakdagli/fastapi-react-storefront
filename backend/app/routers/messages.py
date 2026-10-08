"""Message routes: visitor and member contact, the customer's own messages, and the admin inbox."""

from fastapi import APIRouter, Depends, Response

from app.deps import Conn, CurrentUser, OptionalUser, Pagination, require_admin
from app.errors import ApiError
from app.repositories import messages as repo
from app.schemas.common import Page
from app.schemas.messages import (
    AdminMessageCreateIn,
    AdminMessageOut,
    AdminMessageUpdateIn,
    ContactIn,
    MessageDirection,
    MessageOut,
    MessageStatus,
)

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.post("/contact", status_code=201)
def send_contact(body: ContactIn, conn: Conn, user: OptionalUser) -> dict:
    message = repo.create_inbound(
        conn,
        user_id=user["id"] if user else None,
        name=body.name,
        email=body.email,
        phone=body.phone,
        subject=body.subject,
        body=body.body,
    )
    return {"id": message["id"]}


@router.get("/me/messages", response_model=Page[MessageOut])
def list_my_messages(conn: Conn, user: CurrentUser, p: Pagination) -> dict:
    items = repo.list_for_user(conn, user["id"], p.limit, p.offset)
    total = repo.count_for_user(conn, user["id"])["total"]
    return {"items": items, "total": total, "page": p.page, "page_size": p.page_size}


@admin_router.get("/messages", response_model=Page[AdminMessageOut])
def list_messages(
    conn: Conn,
    p: Pagination,
    status: MessageStatus | None = None,
    direction: MessageDirection | None = None,
) -> dict:
    items = repo.list_admin(
        conn, status=status, direction=direction, limit=p.limit, offset=p.offset
    )
    total = repo.count_admin(conn, status=status, direction=direction)["total"]
    return {"items": items, "total": total, "page": p.page, "page_size": p.page_size}


@admin_router.post("/messages", status_code=201, response_model=AdminMessageOut)
def send_reply(body: AdminMessageCreateIn, conn: Conn) -> dict:
    user = repo.get_user(conn, body.user_id)
    if user is None:
        raise ApiError(422, "invalid_reference", field="user_id")
    return repo.create_outbound(conn, user=user, subject=body.subject, body=body.body)


@admin_router.get("/messages/{message_id}", response_model=AdminMessageOut)
def get_message(message_id: int, conn: Conn) -> dict:
    message = repo.get(conn, message_id)
    if message is None:
        raise ApiError(404, "not_found")
    return message


@admin_router.patch("/messages/{message_id}", response_model=AdminMessageOut)
def update_message(message_id: int, body: AdminMessageUpdateIn, conn: Conn) -> dict:
    message = repo.update(conn, message_id, body.model_dump(exclude_unset=True))
    if message is None:
        raise ApiError(404, "not_found")
    return message


@admin_router.delete("/messages/{message_id}", status_code=204)
def delete_message(message_id: int, conn: Conn) -> Response:
    if repo.delete(conn, message_id) is None:
        raise ApiError(404, "not_found")
    return Response(status_code=204)
