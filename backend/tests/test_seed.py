"""The sample-data seed: what it creates, the accounts it makes, and repeated runs."""

import psycopg
import pytest

from app.security import verify_password
from seed import seed

ADMIN_EMAIL = "Admin@Example.com"  # stored trimmed and lowercased
ADMIN_PASSWORD = "Passw0rd!x"
DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "Demo-Passw0rd!"

_COUNTS_SQL = (
    "SELECT (SELECT count(*) FROM categories) AS categories, "
    "(SELECT count(*) FROM brands) AS brands, "
    "(SELECT count(*) FROM products) AS products, "
    "(SELECT count(*) FROM product_images) AS images, "
    "(SELECT count(*) FROM site_settings) AS site_settings, "
    "(SELECT count(*) FROM users WHERE role = 'admin') AS admins, "
    "(SELECT count(*) FROM users WHERE role = 'customer') AS customers"
)


def _counts(conn: psycopg.Connection) -> dict:
    return conn.execute(_COUNTS_SQL).fetchone()


def test_seed_creates_expected_data(conn: psycopg.Connection) -> None:
    seed(conn, admin_email=ADMIN_EMAIL, admin_password=ADMIN_PASSWORD)

    assert _counts(conn) == {
        "categories": 5,
        "brands": 5,
        "products": 20,
        "images": 0,
        "site_settings": 1,
        "admins": 1,
        "customers": 0,
    }
    category_names = {row["name"] for row in conn.execute("SELECT name FROM categories")}
    assert category_names == {
        "External Drives",
        "SSD Drives",
        "Memory Cards",
        "USB Flash Drives",
        "Accessories",
    }
    brand_names = {row["name"] for row in conn.execute("SELECT name FROM brands")}
    assert brand_names == {"Seagate", "Western Digital", "Samsung", "SanDisk", "Toshiba"}

    products = conn.execute(
        "SELECT sku, is_new, stock, is_active FROM products ORDER BY sku"
    ).fetchall()
    assert [row["sku"] for row in products] == [f"SEED-{n:03d}" for n in range(1, 21)]
    assert sum(row["is_new"] for row in products) >= 8
    assert sum(row["stock"] == 0 for row in products) >= 2
    assert sum(not row["is_active"] for row in products) == 1

    # The sample texts are English and the prices are in dollars.
    first = conn.execute("SELECT name, price FROM products WHERE sku = 'SEED-001'").fetchone()
    assert first["name"] == "Seagate Expansion 1 TB Portable Drive"
    assert str(first["price"]) == "59.99"
    site = conn.execute("SELECT site_name, email FROM site_settings").fetchone()
    assert site == {"site_name": "Sample Shop", "email": "support@example.com"}

    # Seeded products have no image rows; the API shows the placeholder for them.
    assert conn.execute("SELECT count(*) AS n FROM product_images").fetchone()["n"] == 0

    admin = conn.execute(
        "SELECT email, full_name, is_active, password_hash FROM users WHERE role = 'admin'"
    ).fetchone()
    assert admin["email"] == "admin@example.com"
    assert admin["full_name"] == "Site Administrator"
    assert admin["is_active"]
    assert verify_password(ADMIN_PASSWORD, admin["password_hash"])


def test_seed_is_idempotent(conn: psycopg.Connection) -> None:
    seed(
        conn,
        admin_email=ADMIN_EMAIL,
        admin_password=ADMIN_PASSWORD,
        demo_email=DEMO_EMAIL,
        demo_password=DEMO_PASSWORD,
    )
    first = _counts(conn)
    assert first["products"] == 20
    assert first["admins"] == 1
    assert first["customers"] == 1

    seed(
        conn,
        admin_email=ADMIN_EMAIL,
        admin_password=ADMIN_PASSWORD,
        demo_email=DEMO_EMAIL,
        demo_password=DEMO_PASSWORD,
    )
    assert _counts(conn) == first


def test_seed_without_admin_credentials_skips_admin_creation(conn: psycopg.Connection) -> None:
    seed(conn, admin_email=None, admin_password=None)

    counts = _counts(conn)
    assert counts["products"] == 20
    assert counts["admins"] == 0
    assert counts["customers"] == 0


def test_seed_rejects_an_admin_email_without_a_password(conn: psycopg.Connection) -> None:
    with pytest.raises(ValueError, match="ADMIN_EMAIL and ADMIN_PASSWORD must be set together"):
        seed(conn, admin_email=ADMIN_EMAIL, admin_password=None)
    # The check runs before the first write, so a half-configured run leaves the database alone.
    assert _counts(conn)["products"] == 0


def test_seed_refuses_a_placeholder_or_short_password(conn: psycopg.Connection) -> None:
    for password in ("change-me-admin-password", "Change-Me-Please-123", "short"):
        with pytest.raises(ValueError, match="ADMIN_PASSWORD"):
            seed(conn, admin_email=ADMIN_EMAIL, admin_password=password)
    # Nothing is written when the password is refused.
    assert _counts(conn)["products"] == 0
