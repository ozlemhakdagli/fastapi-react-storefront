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
from app.media import PLACEHOLDER_FILE
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

# (name, description) pairs. The names and descriptions are Turkish sample text.
CATEGORIES = (
    ("Harici Diskler", "Taşınabilir HDD ve harici depolama birimleri."),
    ("SSD Diskler", "Hızlı katı hal sürücüleri."),
    ("Bellek Kartları", "SD ve microSD bellek kartları."),
    ("USB Bellekler", "Küçük ve pratik USB bellekler."),
    ("Aksesuarlar", "Kablolar, kılıflar ve diğer aksesuarlar."),
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
        "Seagate Expansion 1 TB Taşınabilir Disk",
        "Seagate",
        "Harici Diskler",
        "USB 3.0 bağlantılı, 1 TB taşınabilir disk.",
        Decimal("1299.90"),
        25,
        is_new=True,
    ),
    SampleProduct(
        "Seagate Expansion 2 TB Taşınabilir Disk",
        "Seagate",
        "Harici Diskler",
        "USB 3.0 bağlantılı, 2 TB taşınabilir disk.",
        Decimal("1749.90"),
        14,
    ),
    SampleProduct(
        "Western Digital My Passport 1 TB",
        "Western Digital",
        "Harici Diskler",
        "İnce tasarımlı, 1 TB taşınabilir disk.",
        Decimal("1349.00"),
        18,
        is_new=True,
    ),
    SampleProduct(
        "Western Digital My Passport 2 TB",
        "Western Digital",
        "Harici Diskler",
        "İnce tasarımlı, 2 TB taşınabilir disk.",
        Decimal("1699.00"),
        0,
    ),
    SampleProduct(
        "Toshiba Canvio Basics 1 TB",
        "Toshiba",
        "Harici Diskler",
        "Günlük kullanım için 1 TB taşınabilir disk.",
        Decimal("1199.00"),
        30,
    ),
    SampleProduct(
        "Samsung T7 500 GB Taşınabilir SSD",
        "Samsung",
        "SSD Diskler",
        "USB 3.2 Gen 2 bağlantılı, 500 GB taşınabilir SSD.",
        Decimal("1899.90"),
        12,
        is_new=True,
    ),
    SampleProduct(
        "Samsung T7 1 TB Taşınabilir SSD",
        "Samsung",
        "SSD Diskler",
        "USB 3.2 Gen 2 bağlantılı, 1 TB taşınabilir SSD.",
        Decimal("3199.90"),
        6,
        is_new=True,
    ),
    SampleProduct(
        "SanDisk Extreme 1 TB Taşınabilir SSD",
        "SanDisk",
        "SSD Diskler",
        "Darbelere dayanıklı, 1 TB taşınabilir SSD.",
        Decimal("2899.00"),
        8,
        is_new=True,
    ),
    SampleProduct(
        "SanDisk Ultra 500 GB Dahili SSD",
        "SanDisk",
        "SSD Diskler",
        "SATA arayüzlü, 500 GB dahili SSD.",
        Decimal("1349.00"),
        0,
    ),
    SampleProduct(
        "Toshiba Q300 1 TB Dahili SSD",
        "Toshiba",
        "SSD Diskler",
        "SATA arayüzlü, 1 TB dahili SSD.",
        Decimal("1599.00"),
        20,
    ),
    SampleProduct(
        "SanDisk Ultra microSDXC 128 GB",
        "SanDisk",
        "Bellek Kartları",
        "Uygulama performanslı, 128 GB microSD kart.",
        Decimal("329.90"),
        60,
        is_new=True,
    ),
    SampleProduct(
        "SanDisk Ultra microSDXC 256 GB",
        "SanDisk",
        "Bellek Kartları",
        "Uygulama performanslı, 256 GB microSD kart.",
        Decimal("589.90"),
        35,
    ),
    SampleProduct(
        "Samsung EVO Plus microSDXC 128 GB",
        "Samsung",
        "Bellek Kartları",
        "Kamera ve tablet için 128 GB microSD kart.",
        Decimal("349.90"),
        42,
        is_new=True,
    ),
    SampleProduct(
        "Samsung PRO Endurance microSDXC 64 GB",
        "Samsung",
        "Bellek Kartları",
        "Sürekli kayıt için dayanıklı 64 GB microSD kart.",
        Decimal("299.00"),
        0,
    ),
    SampleProduct(
        "SanDisk Ultra Flair USB 3.0 64 GB",
        "SanDisk",
        "USB Bellekler",
        "Kompakt tasarımlı 64 GB USB bellek.",
        Decimal("199.90"),
        80,
    ),
    SampleProduct(
        "Samsung BAR Plus USB 3.1 128 GB",
        "Samsung",
        "USB Bellekler",
        "Metal gövdeli 128 GB USB bellek.",
        Decimal("279.90"),
        45,
        is_new=True,
    ),
    SampleProduct(
        "Toshiba TransMemory U301 32 GB",
        "Toshiba",
        "USB Bellekler",
        "Hafif ve dayanıklı 32 GB USB bellek.",
        Decimal("129.90"),
        70,
    ),
    SampleProduct(
        "SanDisk Ultra Dual Drive USB Type-C 128 GB",
        "SanDisk",
        "USB Bellekler",
        "USB Type-C ve USB-A bağlantılı 128 GB bellek.",
        Decimal("349.90"),
        22,
        is_new=True,
    ),
    SampleProduct(
        "Harici Disk Koruyucu Kılıf",
        "Seagate",
        "Aksesuarlar",
        "Darbelere karşı korumalı taşıma kılıfı.",
        Decimal("149.90"),
        40,
    ),
    SampleProduct(
        "USB-C Kablo 1,5 m",
        "Samsung",
        "Aksesuarlar",
        "Satıştan kaldırılmış eski model kablo.",
        Decimal("99.90"),
        30,
        is_active=False,
    ),
)

SITE_SETTINGS = {
    "site_name": "Örnek Mağaza",
    "description": "Depolama ürünleri için örnek bir e-ticaret sitesi.",
    "address": "Örnek Mahallesi, Örnek Sokak No: 1, İstanbul",
    "phone": "+90 212 000 00 00",
    "email": "destek@example.com",
    "about_text": "Örnek Mağaza, depolama ürünlerini uygun fiyatlarla sunar.",
    "contact_text": "Sorularınız için bize e-posta veya telefonla ulaşabilirsiniz.",
}


def _account(email: str | None, password: str | None, prefix: str) -> tuple[str, str] | None:
    """Return the (normalized email, password) of an account, or None when it is not configured."""
    address = (email or "").strip().lower()
    if not address and not password:
        return None
    if not address or not password:
        raise ValueError(f"{prefix}_EMAIL and {prefix}_PASSWORD must be set together")
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
        row = conn.execute(
            "INSERT INTO products (sku, name, brand_id, category_id, short_description, price, "
            "stock, is_new, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (sku) DO NOTHING RETURNING id",
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
        ).fetchone()
        # Only a product inserted by this run gets its image, so a re-run never adds one back.
        if row is not None:
            conn.execute(
                "INSERT INTO product_images (product_id, file_name, position) VALUES (%s, %s, 0)",
                (row["id"], PLACEHOLDER_FILE),
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
            _insert_account(conn, email, hash_password(password), "Site Yöneticisi", "admin")
        if demo is not None:
            email, password = demo
            _insert_account(conn, email, hash_password(password), "Demo Müşteri", "customer")


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
