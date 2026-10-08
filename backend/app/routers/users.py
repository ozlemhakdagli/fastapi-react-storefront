from fastapi import APIRouter, Depends

from app.deps import Conn, Pagination, require_admin
from app.repositories import users
from app.schemas.common import Page
from app.schemas.users import AdminUserCreateIn, AdminUserUpdateIn, UserOut, UserRole
from app.services import auth as auth_service

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@admin_router.get("/users", response_model=Page[UserOut])
def list_users(
    conn: Conn, p: Pagination, role: UserRole | None = None, q: str | None = None
) -> dict:
    items, total = users.list_page(conn, role=role, q=q, limit=p.limit, offset=p.offset)
    return {"items": items, "total": total, "page": p.page, "page_size": p.page_size}


@admin_router.post("/users", status_code=201, response_model=UserOut)
def create_user(data: AdminUserCreateIn, conn: Conn) -> dict:
    return auth_service.admin_create_user(conn, data)


@admin_router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: AdminUserUpdateIn, conn: Conn) -> dict:
    return auth_service.admin_update_user(conn, user_id, data)
