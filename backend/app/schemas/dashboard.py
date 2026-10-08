"""Schema for the admin dashboard counters."""

from pydantic import BaseModel


class DashboardOut(BaseModel):
    new_orders: int
    unread_messages: int
    products: int
    customers: int
