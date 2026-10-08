"""Schemas for user accounts: the public profile and admin account management."""

from typing import Literal, Self

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import Email, FullName, InputModel, Iso, Password, reject_null_fields

UserRole = Literal["customer", "admin"]


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    address: str | None
    role: UserRole
    is_active: bool
    created_at: Iso


class AdminUserCreateIn(InputModel):
    email: Email
    password: Password
    full_name: FullName
    role: UserRole
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)


class AdminUserUpdateIn(InputModel):
    full_name: FullName | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)
    role: UserRole | None = None
    is_active: bool | None = None
    password: Password | None = None

    @model_validator(mode="after")
    def _reject_null_required(self) -> Self:
        reject_null_fields(self, "full_name", "role", "is_active", "password")
        return self
