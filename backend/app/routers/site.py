"""Site settings routes: the public read and the admin read and replace."""

from fastapi import APIRouter, Depends

from app.deps import Conn, require_admin
from app.repositories import site
from app.schemas.site import SiteSettings

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/site", response_model=SiteSettings)
def get_site(conn: Conn) -> dict:
    return site.get(conn)


@admin_router.get("/site", response_model=SiteSettings)
def admin_get_site(conn: Conn) -> dict:
    return site.get(conn)


@admin_router.put("/site", response_model=SiteSettings)
def admin_put_site(body: SiteSettings, conn: Conn) -> dict:
    return site.put(conn, body.model_dump())
