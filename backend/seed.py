"""Sample catalogue, site settings and accounts for local development.

Run from the backend directory after the migrations: python seed.py
Every insert uses ON CONFLICT DO NOTHING, so running the seed again keeps existing rows.
"""

from decimal import Decimal
from typing import NamedTuple

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.config import get_settings
from app.security import hash_password


class SeedSettings(BaseSettings):
    """Keys only the seed reads. They come from the environment or backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", hide_input_in_errors=True)

    admin_email: str | None = None
    admin_password: str | None = None
    demo_customer_email: str | None = None
    demo_customer_password: str | None = None


class SampleProduct(NamedTuple):
    name: str
    brand: str
    category: str
    short_description: str
    price: Decimal
    stock: int
    is_new: bool = False
    is_active: bool = True


# Hard-coded whitelist: a taxonomy kind reaches the SQL text only through these entries.
_TAXONOMY_TABLES = {"categories": sql.Identifier("categories"), "brands": sql.Identifier("brands")}

# (name, description) pairs. The names and descriptions are English sample text.
CATEGORIES = (
    ("External Drives", "Portable HDDs and other external storage."),
    ("SSD Drives", "Fast solid-state drives."),
    ("Memory Cards", "SD and microSD memory cards."),
    ("USB Flash Drives", "Small and handy USB flash drives."),
    ("Accessories", "Cables, cases and other accessories."),
)
BRANDS = (
    ("Seagate", ""),
    ("Western Digital", ""),
    ("Samsung", ""),
    ("SanDisk", ""),
    ("Toshiba", ""),
)

# SKUs are numbered in this order: SEED-001 to SEED-020.
PRODUCTS = (
    SampleProduct(
        "Seagate Expansion 1 TB Portable Drive",
        "Seagate",
        "External Drives",
        "USB 3.0 portable drive, 1 TB.",
        Decimal("59.99"),
        25,
        is_new=True,
    ),
    SampleProduct(
        "Seagate Expansion 2 TB Portable Drive",
        "Seagate",
        "External Drives",
        "USB 3.0 portable drive, 2 TB.",
        Decimal("79.99"),
        14,
    ),
    SampleProduct(
        "Western Digital My Passport 1 TB",
        "Western Digital",
        "External Drives",
        "Slim design, 1 TB portable drive.",
        Decimal("62.99"),
        18,
        is_new=True,
    ),
    SampleProduct(
        "Western Digital My Passport 2 TB",
        "Western Digital",
        "External Drives",
        "Slim design, 2 TB portable drive.",
        Decimal("77.99"),
        0,
    ),
    SampleProduct(
        "Toshiba Canvio Basics 1 TB",
        "Toshiba",
        "External Drives",
        "1 TB portable drive for everyday use.",
        Decimal("54.99"),
        30,
    ),
    SampleProduct(
        "Samsung T7 500 GB Portable SSD",
        "Samsung",
        "SSD Drives",
        "USB 3.2 Gen 2 portable SSD, 500 GB.",
        Decimal("69.99"),
        12,
        is_new=True,
    ),
    SampleProduct(
        "Samsung T7 1 TB Portable SSD",
        "Samsung",
        "SSD Drives",
        "USB 3.2 Gen 2 portable SSD, 1 TB.",
        Decimal("109.99"),
        6,
        is_new=True,
    ),
    SampleProduct(
        "SanDisk Extreme 1 TB Portable SSD",
        "SanDisk",
        "SSD Drives",
        "Shock-resistant 1 TB portable SSD.",
        Decimal("99.99"),
        8,
        is_new=True,
    ),
    SampleProduct(
        "SanDisk Ultra 500 GB Internal SSD",
        "SanDisk",
        "SSD Drives",
        "SATA internal SSD, 500 GB.",
        Decimal("49.99"),
        0,
    ),
    SampleProduct(
        "Toshiba Q300 1 TB Internal SSD",
        "Toshiba",
        "SSD Drives",
        "SATA internal SSD, 1 TB.",
        Decimal("69.99"),
        20,
    ),
    SampleProduct(
        "SanDisk Ultra microSDXC 128 GB",
        "SanDisk",
        "Memory Cards",
        "App-performance microSD card, 128 GB.",
        Decimal("14.99"),
        60,
        is_new=True,
    ),
    SampleProduct(
        "SanDisk Ultra microSDXC 256 GB",
        "SanDisk",
        "Memory Cards",
        "App-performance microSD card, 256 GB.",
        Decimal("26.99"),
        35,
    ),
    SampleProduct(
        "Samsung EVO Plus microSDXC 128 GB",
        "Samsung",
        "Memory Cards",
        "128 GB microSD card for cameras and tablets.",
        Decimal("15.99"),
        42,
        is_new=True,
    ),
    SampleProduct(
        "Samsung PRO Endurance microSDXC 64 GB",
        "Samsung",
        "Memory Cards",
        "Durable 64 GB microSD card for continuous recording.",
        Decimal("13.99"),
        0,
    ),
    SampleProduct(
        "SanDisk Ultra Flair USB 3.0 64 GB",
        "SanDisk",
        "USB Flash Drives",
        "Compact 64 GB USB flash drive.",
        Decimal("9.99"),
        80,
    ),
    SampleProduct(
        "Samsung BAR Plus USB 3.1 128 GB",
        "Samsung",
        "USB Flash Drives",
        "128 GB USB flash drive with a metal body.",
        Decimal("17.99"),
        45,
        is_new=True,
    ),
    SampleProduct(
        "Toshiba TransMemory U301 32 GB",
        "Toshiba",
        "USB Flash Drives",
        "Light and durable 32 GB USB flash drive.",
        Decimal("6.99"),
        70,
    ),
    SampleProduct(
        "SanDisk Ultra Dual Drive USB Type-C 128 GB",
        "SanDisk",
        "USB Flash Drives",
        "128 GB drive with USB Type-C and USB-A connectors.",
        Decimal("19.99"),
        22,
        is_new=True,
    ),
    SampleProduct(
        "External Drive Protective Case",
        "Seagate",
        "Accessories",
        "Shock-protected carrying case for portable drives.",
        Decimal("7.99"),
        40,
    ),
    SampleProduct(
        "USB-C Cable 1.5 m",
        "Samsung",
        "Accessories",
        "Older cable model, no longer sold.",
        Decimal("4.99"),
        30,
        is_active=False,
    ),
)

SITE_SETTINGS = {
    "site_name": "Sample Shop",
    "description": "A sample online shop for storage products.",
    "address": "1 Sample Street, Sample City",
    "phone": "+1 555 010 0100",
    "email": "support@example.com",
    "about_text": "Sample Shop sells storage products at fair prices.",
    "contact_text": "You can reach us by e-mail or by phone with any question.",
}


def _account(email: str | None, password: str | None, prefix: str) -> tuple[str, str] | None:
    """Return the (normalized email, password) of an account, or None when it is not configured."""
    address = (email or "").strip().lower()
    if not address and not password:
        return None
    if not address or not password:
        raise ValueError(f"{prefix}_EMAIL and {prefix}_PASSWORD must be set together")
    if len(password) < 8 or password.lower().startswith("change-me"):
        # A copied .env.example must not create a login with a publicly known password.
        raise ValueError(f"{prefix}_PASSWORD must be at least 8 characters and not a placeholder")
    return address, password


def _insert_taxonomy(
    conn: psycopg.Connection, kind: str, rows: tuple[tuple[str, str], ...]
) -> dict[str, int]:
    """Insert named categories or brands and return their ids by name."""
    table = _TAXONOMY_TABLES[kind]
    insert = sql.SQL(
        "INSERT INTO {} (name, description) VALUES (%s, %s) ON CONFLICT (name) DO NOTHING"
    ).format(table)
    for name, description in rows:
        conn.execute(insert, (name, description))
    found = conn.execute(
        sql.SQL("SELECT id, name FROM {} WHERE name = ANY(%s)").format(table),
        ([name for name, _ in rows],),
    ).fetchall()
    return {row["name"]: row["id"] for row in found}


def _insert_products(
    conn: psycopg.Connection, category_ids: dict[str, int], brand_ids: dict[str, int]
) -> None:
    for number, product in enumerate(PRODUCTS, start=1):
        conn.execute(
            "INSERT INTO products (sku, name, brand_id, category_id, short_description, price, "
            "stock, is_new, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (sku) DO NOTHING",
            (
                f"SEED-{number:03d}",
                product.name,
                brand_ids[product.brand],
                category_ids[product.category],
                product.short_description,
                product.price,
                product.stock,
                product.is_new,
                product.is_active,
            ),
        )


def _insert_site_settings(conn: psycopg.Connection) -> None:
    conn.execute(
        "INSERT INTO site_settings (id, site_name, description, address, phone, email, "
        "about_text, contact_text) VALUES (1, %(site_name)s, %(description)s, %(address)s, "
        "%(phone)s, %(email)s, %(about_text)s, %(contact_text)s) ON CONFLICT (id) DO NOTHING",
        SITE_SETTINGS,
    )


def _insert_account(
    conn: psycopg.Connection, email: str, password_hash: str, full_name: str, role: str
) -> None:
    conn.execute(
        "INSERT INTO users (email, full_name, password_hash, role) VALUES (%s, %s, %s, %s) "
        "ON CONFLICT ((lower(email))) DO NOTHING",
        (email, full_name, password_hash, role),
    )


def seed(
    conn: psycopg.Connection,
    *,
    admin_email: str | None,
    admin_password: str | None,
    demo_email: str | None = None,
    demo_password: str | None = None,
) -> None:
    """Insert the sample catalogue, site settings and the configured accounts in one transaction.

    An account is created only when both its email and password are given. Giving neither skips
    it; giving only one raises ValueError before anything is written.
    """
    admin = _account(admin_email, admin_password, "ADMIN")
    demo = _account(demo_email, demo_password, "DEMO_CUSTOMER")
    with conn.transaction():
        category_ids = _insert_taxonomy(conn, "categories", CATEGORIES)
        brand_ids = _insert_taxonomy(conn, "brands", BRANDS)
        _insert_products(conn, category_ids, brand_ids)
        _insert_site_settings(conn)
        if admin is not None:
            email, password = admin
            _insert_account(conn, email, hash_password(password), "Site Administrator", "admin")
        if demo is not None:
            email, password = demo
            _insert_account(conn, email, hash_password(password), "Demo Customer", "customer")


def main() -> None:
    """Seed the database named by DATABASE_URL, with the seed keys from the environment or .env."""
    settings = get_settings()
    keys = SeedSettings()
    with psycopg.connect(settings.database_url, autocommit=True, row_factory=dict_row) as conn:
        seed(
            conn,
            admin_email=keys.admin_email,
            admin_password=keys.admin_password,
            demo_email=keys.demo_customer_email,
            demo_password=keys.demo_customer_password,
        )
    print("Sample data is in place.")


if __name__ == "__main__":
    main()
