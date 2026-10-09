"""Schemas for products and product images.

cost_price exists only on admin-facing models (AdminProduct and ProductIn), never on the
public ProductListItem or ProductDetail.
"""

from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import InputModel, Iso, Money, Named

MAX_PRICE = Decimal("1000000.00")


class ProductImageOut(BaseModel):
    id: int
    url: str
    position: int


class ProductListItem(BaseModel):
    id: int
    sku: str
    name: str
    short_description: str
    price: Money
    stock: int
    is_new: bool
    brand: Named | None
    category: Named | None
    image_url: str


class ProductDetail(ProductListItem):
    description: str
    images: list[ProductImageOut]
    created_at: Iso


class AdminProduct(ProductDetail):
    cost_price: Money | None
    is_active: bool
    updated_at: Iso


class ProductIn(InputModel):
    sku: str = Field(pattern=r"^[A-Za-z0-9._-]{1,64}$")
    name: str = Field(min_length=1, max_length=200)
    brand_id: int | None = None
    category_id: int | None = None
    short_description: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=5000)
    price: Money
    cost_price: Money | None = None
    stock: int = Field(ge=0, le=1_000_000)
    is_new: bool = False
    is_active: bool = True
    # PUT only: the `updated_at` of the product as the form loaded it. When another change (a sale,
    # an order cancellation, another admin) happened since, the save is refused with 409
    # product_changed instead of overwriting that change, stock above all.
    expected_updated_at: Iso | None = None

    @field_validator("price", "cost_price")
    @classmethod
    def _limit_price(cls, value: Decimal | None) -> Decimal | None:
        """Keep a full cart of the dearest product inside the NUMERIC(12,2) order total."""
        if value is not None and value > MAX_PRICE:
            raise ValueError("must be at most 1000000.00")
        return value


class ImageOrderIn(InputModel):
    image_ids: list[int]
