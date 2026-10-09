from fastapi import APIRouter, Depends, Request

from app.deps import Conn, CurrentUser, require_admin
from app.repositories import users
from app.schemas.auth import ChangePasswordIn, LoginIn, ProfileUpdateIn, RegisterIn, TokenOut
from app.schemas.users import UserOut
from app.security import create_access_token
from app.services import auth as auth_service

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.post("/auth/register", status_code=201, response_model=UserOut)
def register(data: RegisterIn, request: Request) -> dict:
    # No Conn dependency: the service borrows a connection only for the insert, not for hashing.
    return auth_service.register(request.app.state.pool, data)


@router.post("/auth/login", response_model=TokenOut)
def login(data: LoginIn, request: Request) -> TokenOut:
    user = auth_service.authenticate(request.app.state.pool, data.email, data.password)
    return TokenOut(access_token=create_access_token(user["id"], user["token_version"]), user=user)


@router.get("/auth/me", response_model=UserOut)
def read_me(user: CurrentUser) -> dict:
    return user


@router.patch("/auth/me", response_model=UserOut)
def update_me(data: ProfileUpdateIn, user: CurrentUser, conn: Conn) -> dict:
    return users.update(conn, user["id"], data.model_dump(exclude_unset=True))


@router.post("/auth/change-password", response_model=TokenOut)
def change_password(data: ChangePasswordIn, user: CurrentUser, conn: Conn) -> TokenOut:
    # The other sessions end with the old version; this one continues with a token for the new one.
    updated = auth_service.change_password(conn, user, data.current_password, data.new_password)
    token = create_access_token(updated["id"], updated["token_version"])
    return TokenOut(access_token=token, user=updated)
