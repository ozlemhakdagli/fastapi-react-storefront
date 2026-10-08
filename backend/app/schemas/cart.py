"""Schemas for the shopping cart."""

from pydantic import BaseModel, Field

from app.schemas.common import InputModel, Money


class CartItemIn(InputModel):
    product_id: int
    quantity: int = Field(ge=1, le=99)


class CartItemSetIn(InputModel):
    quantity: int = Field(ge=1, le=99)


class CartItemOut(BaseModel):
    product_id: int
    name: str
    unit_price: Money
    quantity: int
    line_total: Money
    stock: int
    image_url: str


class CartOut(BaseModel):
    items: list[CartItemOut]
    total: Money
