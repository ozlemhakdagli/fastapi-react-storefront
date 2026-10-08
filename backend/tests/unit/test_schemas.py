"""Unit tests for the Pydantic schemas. No database is needed."""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginIn, ProfileUpdateIn, RegisterIn
from app.schemas.cart import CartItemIn
from app.schemas.comments import CommentOut
from app.schemas.common import Named, Page
from app.schemas.products import AdminProduct, ProductDetail, ProductIn, ProductListItem
from app.schemas.users import AdminUserUpdateIn


def product_row(**overrides: object) -> dict[str, object]:
    """A dict shaped like ProductListItem in contract section 4."""
    row: dict[str, object] = {
        "id": 1,
        "sku": "SSD-1.0_a",
        "name": "Samsung SSD 1TB",
        "short_description": "Fast NVMe drive",
        "price": "1299.90",
        "stock": 5,
        "is_new": True,
        "brand": {"id": 2, "name": "Samsung"},
        "category": None,
        "image_url": "/api/media/placeholder.svg",
    }
    row.update(overrides)
    return row


def product_in(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {"sku": "SSD-1", "name": "SSD", "price": "10.00", "stock": 1}
    data.update(overrides)
    return data


def register_in(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {"email": "  A@B.com ", "password": "Passw0rd!", "full_name": "Ada"}
    data.update(overrides)
    return data


def test_money_serializes_with_two_decimals() -> None:
    whole = ProductListItem.model_validate(product_row(price=Decimal("5")))
    fractional = ProductListItem.model_validate(product_row(price=Decimal("1299.9")))
    assert whole.model_dump(mode="json")["price"] == "5.00"
    assert fractional.model_dump(mode="json")["price"] == "1299.90"


@pytest.mark.parametrize("raw", ["12.5", 12.5])
def test_money_input_accepts_string_and_number(raw: object) -> None:
    price = ProductIn.model_validate(product_in(price=raw)).price
    assert price == Decimal("12.50")
    assert str(price) == "12.50"


@pytest.mark.parametrize("raw", ["1.234", "-1"])
def test_money_input_rejects_three_decimals_and_negatives(raw: str) -> None:
    with pytest.raises(ValidationError):
        ProductIn.model_validate(product_in(price=raw))


def test_register_in_normalizes_and_limits() -> None:
    assert RegisterIn.model_validate(register_in()).email == "a@b.com"
    for password in ("x" * 8, "x" * 128):
        assert RegisterIn.model_validate(register_in(password=password)).password == password
    for password in ("x" * 7, "x" * 129):
        with pytest.raises(ValidationError):
            RegisterIn.model_validate(register_in(password=password))
    with pytest.raises(ValidationError):
        RegisterIn.model_validate(register_in(email="not-an-email"))
    with pytest.raises(ValidationError):
        RegisterIn.model_validate(register_in(role="admin"))
    with pytest.raises(ValidationError):
        RegisterIn.model_validate(register_in(phone="1" * 31))


def test_cart_quantity_bounds() -> None:
    for quantity in (0, 100, -1):
        with pytest.raises(ValidationError):
            CartItemIn(product_id=1, quantity=quantity)
    for quantity in (1, 99):
        assert CartItemIn(product_id=1, quantity=quantity).quantity == quantity


def test_product_in_sku_pattern() -> None:
    with pytest.raises(ValidationError):
        ProductIn.model_validate(product_in(sku="ab c"))
    assert ProductIn.model_validate(product_in(sku="SSD-1.0_a")).sku == "SSD-1.0_a"


def test_page_serializes() -> None:
    page = Page[ProductListItem](items=[], total=0, page=1, page_size=20)
    assert page.model_dump(mode="json") == {"items": [], "total": 0, "page": 1, "page_size": 20}


def test_models_validate_from_dict_rows() -> None:
    item = ProductListItem.model_validate(product_row())
    assert item.brand == Named(id=2, name="Samsung")
    assert item.model_dump(mode="json")["price"] == "1299.90"


def test_cost_price_exists_only_on_admin_models() -> None:
    assert "cost_price" not in ProductListItem.model_fields
    assert "cost_price" not in ProductDetail.model_fields
    assert "cost_price" in AdminProduct.model_fields
    assert "cost_price" in ProductIn.model_fields


def test_timestamps_serialize_as_utc_strings() -> None:
    comment = CommentOut.model_validate(
        {
            "id": 1,
            "product_id": 2,
            "user_id": 3,
            "author_name": "Ada",
            "body": "Nice",
            "created_at": "2026-10-08T15:00:00+03:00",
        }
    )
    assert comment.model_dump(mode="json")["created_at"] == "2026-10-08T12:00:00Z"


def test_login_accepts_short_passwords_so_wrong_password_gets_401() -> None:
    assert LoginIn.model_validate({"email": "a@b.com", "password": "short"}).password == "short"


def test_profile_update_rejects_protected_fields() -> None:
    for field, value in (("role", "admin"), ("email", "a@b.com"), ("is_active", False)):
        with pytest.raises(ValidationError):
            ProfileUpdateIn.model_validate({field: value})


def test_patch_bodies_reject_null_only_for_not_null_columns() -> None:
    assert ProfileUpdateIn.model_validate({"phone": None}).phone is None
    with pytest.raises(ValidationError):
        ProfileUpdateIn.model_validate({"full_name": None})
    with pytest.raises(ValidationError):
        AdminUserUpdateIn.model_validate({"role": None})
