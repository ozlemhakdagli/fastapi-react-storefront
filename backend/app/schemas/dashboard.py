"""Schemas for the admin dashboard: the counters, the 14-day chart and the two short lists."""

import datetime

from pydantic import BaseModel

from app.schemas.common import Iso, Money
from app.schemas.orders import OrderStatus


class OrdersByStatus(BaseModel):
    new: int
    approved: int
    rejected: int
    cancelled: int
    shipped: int
    completed: int


class DayOut(BaseModel):
    date: datetime.date
    orders: int
    revenue: Money


class RecentOrderOut(BaseModel):
    id: int
    customer_name: str
    status: OrderStatus
    total: Money
    created_at: Iso


class LowStockOut(BaseModel):
    id: int
    sku: str
    name: str
    stock: int


class DashboardOut(BaseModel):
    new_orders: int
    unread_messages: int
    products: int
    customers: int
    orders_by_status: OrdersByStatus
    orders_per_day: list[DayOut]
    recent_orders: list[RecentOrderOut]
    low_stock: list[LowStockOut]
