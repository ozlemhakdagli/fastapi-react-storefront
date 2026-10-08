from fastapi import APIRouter, Depends

from app.deps import Conn, require_admin
from app.repositories import dashboard as repo
from app.schemas.dashboard import DashboardOut

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


@admin_router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(conn: Conn) -> dict:
    return repo.counts(conn)
