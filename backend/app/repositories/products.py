"""SQL for products and their images. Functions take the connection first and return dicts."""

from datetime import datetime

import psycopg
from psycopg import sql

# Public reads never select cost_price, is_active or updated_at.
_PUBLIC_COLUMNS = sql.SQL(
    "p.id, p.sku, p.name, p.short_description, p.description, p.price, p.stock, p.is_new, "
    "p.created_at, p.brand_id, b.name AS brand_name, p.category_id, c.name AS category_name"
)
_ADMIN_COLUMNS = sql.SQL("{public}, p.cost_price, p.is_active, p.updated_at").format(
    public=_PUBLIC_COLUMNS
)
_FROM = sql.SQL(
    "FROM products p "
    "LEFT JOIN brands b ON b.id = p.brand_id "
    "LEFT JOIN categories c ON c.id = p.category_id"
)
# API sort keys map to these fixed clauses. Nothing from the request reaches the SQL text.
_PUBLIC_SORTS = {
    "newest": sql.SQL("p.created_at DESC, p.id DESC"),
    "price_asc": sql.SQL("p.price ASC, p.id ASC"),
    "price_desc": sql.SQL("p.price DESC, p.id DESC"),
}
_ADMIN_ORDER = sql.SQL("p.created_at DESC, p.id DESC")

# A hard-coded SQL condition with one placeholder per value, and those values.
type _Filter = tuple[str, tuple[object, ...]]

# The writable product columns, in the order that _INSERT_PRODUCT and _UPDATE_PRODUCT bind them.
_PRODUCT_FIELDS = (
    "sku",
    "name",
    "brand_id",
    "category_id",
    "short_description",
    "description",
    "price",
    "cost_price",
    "stock",
    "is_new",
    "is_active",
)

_INSERT_PRODUCT = """
    INSERT INTO products (sku, name, brand_id, category_id, short_description, description,
                          price, cost_price, stock, is_new, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id
"""

_UPDATE_PRODUCT = """
    UPDATE products
    SET sku = %s, name = %s, brand_id = %s, category_id = %s,
        short_description = %s, description = %s,
        price = %s, cost_price = %s, stock = %s, is_new = %s,
        is_active = %s, updated_at = now()
    WHERE id = %s AND (%s::timestamptz IS NULL OR updated_at = %s::timestamptz)
    RETURNING id
"""


def _like_pattern(term: str) -> str:
    """A LIKE pattern that finds term anywhere. The wildcard characters in term match literally."""
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return "%" + escaped + "%"


def _where(base: str, filters: list[_Filter]) -> tuple[sql.Composable, list[object]]:
    clauses = [sql.SQL(base), *(sql.SQL(condition) for condition, _ in filters)]
    params = [value for _, values in filters for value in values]
    return sql.SQL(" AND ").join(clauses), params


def _shared_filters(q: str | None, category_id: int | None, brand_id: int | None) -> list[_Filter]:
    filters: list[_Filter] = []
    term = (q or "").strip()
    if term:
        pattern = _like_pattern(term)
        filters.append(("(p.name ILIKE %s OR p.sku ILIKE %s)", (pattern, pattern)))
    if category_id is not None:
        filters.append(("p.category_id = %s", (category_id,)))
    if brand_id is not None:
        filters.append(("p.brand_id = %s", (brand_id,)))
    return filters


def _page(
    conn: psycopg.Connection,
    columns: sql.Composable,
    where: sql.Composable,
    params: list[object],
    order: sql.Composable,
    limit: int,
    offset: int,
) -> tuple[list[dict], int]:
    total = conn.execute(
        sql.SQL("SELECT count(*) AS total FROM products p WHERE {where}").format(where=where),
        params,
    ).fetchone()["total"]
    query = sql.SQL(
        "SELECT {columns} {from_} WHERE {where} ORDER BY {order} LIMIT %s OFFSET %s"
    ).format(columns=columns, from_=_FROM, where=where, order=order)
    rows = conn.execute(query, [*params, limit, offset]).fetchall()
    return rows, total


def list_public(
    conn: psycopg.Connection,
    *,
    category_id: int | None,
    brand_id: int | None,
    is_new: bool | None,
    q: str | None,
    sort: str,
    limit: int,
    offset: int,
) -> tuple[list[dict], int]:
    """Active products for the catalogue, with the total that matches the filters."""
    filters = _shared_filters(q, category_id, brand_id)
    if is_new is not None:
        filters.append(("p.is_new = %s", (is_new,)))
    where, params = _where("p.is_active", filters)
    return _page(conn, _PUBLIC_COLUMNS, where, params, _PUBLIC_SORTS[sort], limit, offset)


def get_public(conn: psycopg.Connection, product_id: int) -> dict | None:
    """One active product, or None when it is missing or inactive."""
    query = sql.SQL("SELECT {columns} {from_} WHERE p.id = %s AND p.is_active").format(
        columns=_PUBLIC_COLUMNS, from_=_FROM
    )
    return conn.execute(query, (product_id,)).fetchone()


def list_admin(
    conn: psycopg.Connection,
    *,
    q: str | None,
    category_id: int | None,
    brand_id: int | None,
    is_active: bool | None,
    limit: int,
    offset: int,
) -> tuple[list[dict], int]:
    """All products, inactive ones included, with the admin columns."""
    filters = _shared_filters(q, category_id, brand_id)
    if is_active is not None:
        filters.append(("p.is_active = %s", (is_active,)))
    where, params = _where("TRUE", filters)
    return _page(conn, _ADMIN_COLUMNS, where, params, _ADMIN_ORDER, limit, offset)


def get_admin(conn: psycopg.Connection, product_id: int) -> dict | None:
    query = sql.SQL("SELECT {columns} {from_} WHERE p.id = %s").format(
        columns=_ADMIN_COLUMNS, from_=_FROM
    )
    return conn.execute(query, (product_id,)).fetchone()


def missing_reference(
    conn: psycopg.Connection, brand_id: int | None, category_id: int | None
) -> str | None:
    """'brand_id' or 'category_id' for the first id that names no row, otherwise None.

    A plain comparison never overflows, which an INSERT of an id outside the bigint range would.
    """
    if brand_id is not None and (
        conn.execute("SELECT 1 FROM brands WHERE id = %s", (brand_id,)).fetchone() is None
    ):
        return "brand_id"
    if category_id is not None and (
        conn.execute("SELECT 1 FROM categories WHERE id = %s", (category_id,)).fetchone() is None
    ):
        return "category_id"
    return None


def _values(data: dict) -> tuple[object, ...]:
    return tuple(data[field] for field in _PRODUCT_FIELDS)


def create(conn: psycopg.Connection, data: dict) -> dict:
    """Insert a product from the ProductIn fields and return its id."""
    return conn.execute(_INSERT_PRODUCT, _values(data)).fetchone()


def replace(
    conn: psycopg.Connection,
    product_id: int,
    data: dict,
    expected_updated_at: datetime | None = None,
) -> dict | None:
    """Overwrite every writable field.

    Returns None when nothing was updated: the product does not exist, or (when
    `expected_updated_at` is given) it changed since that version. Use exists() to tell apart.
    """
    params = (*_values(data), product_id, expected_updated_at, expected_updated_at)
    return conn.execute(_UPDATE_PRODUCT, params).fetchone()


def exists(conn: psycopg.Connection, product_id: int) -> bool:
    row = conn.execute("SELECT 1 AS found FROM products WHERE id = %s", (product_id,)).fetchone()
    return row is not None


def delete(conn: psycopg.Connection, product_id: int) -> bool:
    """Delete a product. The image rows go with it; their files are the caller's to remove."""
    row = conn.execute("DELETE FROM products WHERE id = %s RETURNING id", (product_id,)).fetchone()
    return row is not None


def has_orders(conn: psycopg.Connection, product_id: int) -> bool:
    row = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM order_items WHERE product_id = %s) AS found", (product_id,)
    ).fetchone()
    return row["found"]


def images_for(conn: psycopg.Connection, product_ids: list[int]) -> dict[int, list[dict]]:
    """The images of several products in one query, grouped by product id, in position order."""
    grouped: dict[int, list[dict]] = {}
    if not product_ids:
        return grouped
    rows = conn.execute(
        "SELECT id, product_id, file_name, thumb_name, position FROM product_images "
        "WHERE product_id = ANY(%s) ORDER BY product_id, position, id",
        (product_ids,),
    ).fetchall()
    for row in rows:
        grouped.setdefault(row["product_id"], []).append(row)
    return grouped


def add_image(
    conn: psycopg.Connection, product_id: int, file_name: str, thumb_name: str
) -> dict | None:
    """Append an image after the current last position. Returns None when the product is missing.

    The product row is locked first, so two uploads for one product cannot take the same position.
    """
    with conn.transaction():
        locked = conn.execute(
            "SELECT id FROM products WHERE id = %s FOR UPDATE", (product_id,)
        ).fetchone()
        if locked is None:
            return None
        return conn.execute(
            "INSERT INTO product_images (product_id, file_name, thumb_name, position) "
            "SELECT %s, %s, %s, COALESCE(MAX(position) + 1, 0) FROM product_images "
            "WHERE product_id = %s RETURNING id, file_name, thumb_name, position",
            (product_id, file_name, thumb_name, product_id),
        ).fetchone()


def set_image_order(conn: psycopg.Connection, product_id: int, image_ids: list[int]) -> bool:
    """Give the images the positions 0, 1, 2, ... in the order of image_ids.

    Returns False and changes nothing unless image_ids names each image of the product once.
    The unique (product_id, position) constraint is deferred, so positions may pass each other.
    """
    with conn.transaction():
        conn.execute("SELECT id FROM products WHERE id = %s FOR UPDATE", (product_id,))
        current = conn.execute(
            "SELECT id FROM product_images WHERE product_id = %s", (product_id,)
        ).fetchall()
        if sorted(row["id"] for row in current) != sorted(image_ids):
            return False
        for position, image_id in enumerate(image_ids):
            conn.execute(
                "UPDATE product_images SET position = %s WHERE id = %s AND product_id = %s",
                (position, image_id, product_id),
            )
    return True


def delete_image(conn: psycopg.Connection, product_id: int, image_id: int) -> dict | None:
    """Delete one image and return its file names, or None if it is not this product's image."""
    return conn.execute(
        "DELETE FROM product_images WHERE id = %s AND product_id = %s "
        "RETURNING file_name, thumb_name",
        (image_id, product_id),
    ).fetchone()
