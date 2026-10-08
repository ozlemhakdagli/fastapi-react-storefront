"""Schemas for orders, in both the customer view and the admin view."""

from typing import Literal, Self

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import InputModel, Iso, Money, reject_null_fields

OrderStatus = Literal["new", "approved", "rejected", "cancelled", "shipped", "completed"]


class OrderCreateIn(InputModel):
    ship_name: str = Field(min_length=1, max_length=100)
    ship_phone: str = Field(min_length=1, max_length=30)
    ship_address: str = Field(min_length=1, max_length=500)


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    unit_price: Money
    quantity: int
    line_total: Money


class Customer(BaseModel):
    id: int
    email: str
    full_name: str


class OrderListItem(BaseModel):
    id: int
    status: OrderStatus
    total: Money
    item_count: int
    created_at: Iso


class OrderOut(OrderListItem):
    ship_name: str
    ship_phone: str
    ship_address: str
    cargo_company: str | None
    tracking_no: str | None
    updated_at: Iso
    items: list[OrderItemOut]


class AdminOrderListItem(OrderListItem):
    customer: Customer


class AdminOrderOut(OrderOut):
    customer: Customer
    admin_note: str | None


class AdminOrderUpdateIn(InputModel):
    status: OrderStatus | None = None
    cargo_company: str | None = Field(default=None, max_length=100)
    tracking_no: str | None = Field(default=None, max_length=100)
    admin_note: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _reject_null_status(self) -> Self:
        reject_null_fields(self, "status")
        return self
