"""Public product catalogue and admin product and image endpoints (see docs/api.md)."""

from typing import Annotated, Literal

import psycopg
from fastapi import APIRouter, Depends, File, UploadFile
from psycopg.errors import ForeignKeyViolation, RestrictViolation, UniqueViolation

from app.config import get_settings
from app.deps import Conn, Pagination, require_admin
from app.errors import ApiError
from app.media import image_url
from app.repositories import products
from app.schemas.common import Page
from app.schemas.products import (
    AdminProduct,
    ImageOrderIn,
    ProductDetail,
    ProductImageOut,
    ProductIn,
    ProductListItem,
    ProductReplaceIn,
)
from app.services.images import detect_image_type, remove_image_file, store_image

# Public and customer endpoints are mounted at /api.
router = APIRouter()
# Admin endpoints are mounted at /api/admin; every route requires an admin.
admin_router = APIRouter(dependencies=[Depends(require_admin)])

# The foreign keys of products, by constraint name, mapped to the request field they came from.
_REFERENCE_FIELDS = {
    "products_brand_id_fkey": "brand_id",
    "products_category_id_fkey": "category_id",
}


def _named(item_id: int | None, name: str | None) -> dict | None:
    return None if item_id is None else {"id": item_id, "name": name}


def _image_out(image: dict) -> dict:
    return {"id": image["id"], "url": image_url(image["file_name"]), "position": image["position"]}


def _list_item(row: dict, images: list[dict]) -> dict:
    # Images come in position order, so the first one is the cover. No image means the placeholder.
    cover = images[0]["file_name"] if images else None
    return {
        "id": row["id"],
        "sku": row["sku"],
        "name": row["name"],
        "short_description": row["short_description"],
        "price": row["price"],
        "stock": row["stock"],
        "is_new": row["is_new"],
        "brand": _named(row["brand_id"], row["brand_name"]),
        "category": _named(row["category_id"], row["category_name"]),
        "image_url": image_url(cover),
    }


def _detail(row: dict, images: list[dict]) -> dict:
    return {
        **_list_item(row, images),
        "description": row["description"],
        "images": [_image_out(image) for image in images],
        "created_at": row["created_at"],
    }


def _admin(row: dict, images: list[dict]) -> dict:
    return {
        **_detail(row, images),
        "cost_price": row["cost_price"],
        "is_active": row["is_active"],
        "updated_at": row["updated_at"],
    }


def _admin_product(conn: psycopg.Connection, product_id: int) -> dict:
    row = products.get_admin(conn, product_id)
    if row is None:
        raise ApiError(404, "not_found")
    return _admin(row, products.images_for(conn, [product_id]).get(product_id, []))


def _require_references(
    conn: psycopg.Connection, brand_id: int | None, category_id: int | None
) -> None:
    field = products.missing_reference(conn, brand_id, category_id)
    if field is not None:
        raise ApiError(422, "invalid_reference", field=field)


def _write_failed(exc: UniqueViolation | ForeignKeyViolation) -> ApiError:
    """The error for a product write that the database refused."""
    if isinstance(exc, UniqueViolation):
        return ApiError(409, "sku_taken")
    # A brand or category that was deleted after the reference check.
    return ApiError(422, "invalid_reference", field=_REFERENCE_FIELDS[exc.diag.constraint_name])


@router.get("/products", response_model=Page[ProductListItem])
def list_products(
    conn: Conn,
    p: Pagination,
    category_id: int | None = None,
    brand_id: int | None = None,
    is_new: bool | None = None,
    q: str | None = None,
    sort: Literal["newest", "price_asc", "price_desc"] = "newest",
) -> dict:
    rows, total = products.list_public(
        conn,
        category_id=category_id,
        brand_id=brand_id,
        is_new=is_new,
        q=q,
        sort=sort,
        limit=p.limit,
        offset=p.offset,
    )
    images = products.images_for(conn, [row["id"] for row in rows])
    return p.page_of([_list_item(row, images.get(row["id"], [])) for row in rows], total)


@router.get("/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: int, conn: Conn) -> dict:
    row = products.get_public(conn, product_id)
    if row is None:
        raise ApiError(404, "not_found")
    return _detail(row, products.images_for(conn, [product_id]).get(product_id, []))


@admin_router.get("/products", response_model=Page[AdminProduct])
def list_admin_products(
    conn: Conn,
    p: Pagination,
    q: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    is_active: bool | None = None,
) -> dict:
    rows, total = products.list_admin(
        conn,
        q=q,
        category_id=category_id,
        brand_id=brand_id,
        is_active=is_active,
        limit=p.limit,
        offset=p.offset,
    )
    images = products.images_for(conn, [row["id"] for row in rows])
    return p.page_of([_admin(row, images.get(row["id"], [])) for row in rows], total)


@admin_router.post("/products", status_code=201, response_model=AdminProduct)
def create_product(body: ProductIn, conn: Conn) -> dict:
    data = body.model_dump()
    _require_references(conn, data["brand_id"], data["category_id"])
    try:
        product_id = products.create(conn, data)["id"]
    except (UniqueViolation, ForeignKeyViolation) as exc:
        raise _write_failed(exc) from None
    return _admin_product(conn, product_id)


@admin_router.get("/products/{product_id}", response_model=AdminProduct)
def get_admin_product(product_id: int, conn: Conn) -> dict:
    return _admin_product(conn, product_id)


@admin_router.put("/products/{product_id}", response_model=AdminProduct)
def replace_product(product_id: int, body: ProductReplaceIn, conn: Conn) -> dict:
    data = body.model_dump()
    expected_updated_at = data.pop("expected_updated_at")
    _require_references(conn, data["brand_id"], data["category_id"])
    try:
        updated = products.replace(conn, product_id, data, expected_updated_at)
    except (UniqueViolation, ForeignKeyViolation) as exc:
        raise _write_failed(exc) from None
    if updated is None:
        if products.exists(conn, product_id):
            raise ApiError(409, "product_changed")
        raise ApiError(404, "not_found")
    return _admin_product(conn, product_id)


@admin_router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, conn: Conn) -> None:
    if products.has_orders(conn, product_id):
        raise ApiError(409, "has_dependencies")
    images = products.images_for(conn, [product_id]).get(product_id, [])
    try:
        deleted = products.delete(conn, product_id)
    except RestrictViolation:  # an order line was added after the check above
        raise ApiError(409, "has_dependencies") from None
    if not deleted:
        raise ApiError(404, "not_found")
    upload_dir = get_settings().upload_dir
    for image in images:
        remove_image_file(upload_dir, image["file_name"])


@admin_router.post("/products/{product_id}/images", status_code=201, response_model=ProductImageOut)
def upload_image(product_id: int, conn: Conn, file: Annotated[UploadFile, File()]) -> dict:
    settings = get_settings()
    if products.get_admin(conn, product_id) is None:
        raise ApiError(404, "not_found")
    # Read one byte past the limit, so an oversize file is recognised without being read whole.
    data = file.file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise ApiError(413, "file_too_large")
    kind = detect_image_type(data)
    if kind is None:
        raise ApiError(415, "unsupported_media_type")
    file_name = store_image(settings.upload_dir, data, kind)
    image = products.add_image(conn, product_id, file_name)
    if image is None:  # the product was deleted while the upload was in progress
        remove_image_file(settings.upload_dir, file_name)
        raise ApiError(404, "not_found")
    return _image_out(image)


@admin_router.put("/products/{product_id}/images/order", response_model=AdminProduct)
def reorder_images(product_id: int, body: ImageOrderIn, conn: Conn) -> dict:
    if products.get_admin(conn, product_id) is None:
        raise ApiError(404, "not_found")
    if not products.set_image_order(conn, product_id, body.image_ids):
        raise ApiError(422, "invalid_reference", field="image_ids")
    return _admin_product(conn, product_id)


@admin_router.delete("/products/{product_id}/images/{image_id}", status_code=204)
def delete_image(product_id: int, image_id: int, conn: Conn) -> None:
    file_name = products.delete_image(conn, product_id, image_id)
    if file_name is None:
        raise ApiError(404, "not_found")
    remove_image_file(get_settings().upload_dir, file_name)
