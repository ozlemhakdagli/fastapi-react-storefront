"""Category and brand routes: public lists and admin CRUD."""

from fastapi import APIRouter, Depends, Response
from psycopg import Connection
from psycopg.errors import RestrictViolation, UniqueViolation

from app.deps import Conn, require_admin
from app.errors import ApiError
from app.repositories import taxonomy
from app.schemas.taxonomy import TaxonomyIn, TaxonomyOut

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])


def _create(conn: Connection, kind: taxonomy.Kind, body: TaxonomyIn) -> dict:
    try:
        return taxonomy.create(conn, kind, body.name, body.description)
    except UniqueViolation:
        raise ApiError(409, "name_taken") from None


def _update(conn: Connection, kind: taxonomy.Kind, item_id: int, body: TaxonomyIn) -> dict:
    try:
        row = taxonomy.update(conn, kind, item_id, body.name, body.description)
    except UniqueViolation:
        raise ApiError(409, "name_taken") from None
    if row is None:
        raise ApiError(404, "not_found")
    return row


def _delete(conn: Connection, kind: taxonomy.Kind, item_id: int) -> Response:
    # The pre-check handles the usual case. RestrictViolation covers a product added between
    # the check and the delete, because the database enforces the reference either way.
    if taxonomy.has_products(conn, kind, item_id) is not None:
        raise ApiError(409, "has_dependencies")
    try:
        row = taxonomy.delete(conn, kind, item_id)
    except RestrictViolation:
        raise ApiError(409, "has_dependencies") from None
    if row is None:
        raise ApiError(404, "not_found")
    return Response(status_code=204)


@router.get("/categories", response_model=list[TaxonomyOut])
def list_categories(conn: Conn) -> list[dict]:
    return taxonomy.list_all(conn, "categories")


@router.get("/brands", response_model=list[TaxonomyOut])
def list_brands(conn: Conn) -> list[dict]:
    return taxonomy.list_all(conn, "brands")


@admin_router.get("/categories", response_model=list[TaxonomyOut])
def admin_list_categories(conn: Conn) -> list[dict]:
    return taxonomy.list_all(conn, "categories")


@admin_router.post("/categories", status_code=201, response_model=TaxonomyOut)
def admin_create_category(body: TaxonomyIn, conn: Conn) -> dict:
    return _create(conn, "categories", body)


@admin_router.put("/categories/{item_id}", response_model=TaxonomyOut)
def admin_update_category(item_id: int, body: TaxonomyIn, conn: Conn) -> dict:
    return _update(conn, "categories", item_id, body)


@admin_router.delete("/categories/{item_id}", status_code=204)
def admin_delete_category(item_id: int, conn: Conn) -> Response:
    return _delete(conn, "categories", item_id)


@admin_router.get("/brands", response_model=list[TaxonomyOut])
def admin_list_brands(conn: Conn) -> list[dict]:
    return taxonomy.list_all(conn, "brands")


@admin_router.post("/brands", status_code=201, response_model=TaxonomyOut)
def admin_create_brand(body: TaxonomyIn, conn: Conn) -> dict:
    return _create(conn, "brands", body)


@admin_router.put("/brands/{item_id}", response_model=TaxonomyOut)
def admin_update_brand(item_id: int, body: TaxonomyIn, conn: Conn) -> dict:
    return _update(conn, "brands", item_id, body)


@admin_router.delete("/brands/{item_id}", status_code=204)
def admin_delete_brand(item_id: int, conn: Conn) -> Response:
    return _delete(conn, "brands", item_id)
