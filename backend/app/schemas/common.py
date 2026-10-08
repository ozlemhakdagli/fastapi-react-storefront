"""Shared schema types: money, timestamps, emails, passwords, pages and base classes."""

from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    EmailStr,
    Field,
    PlainSerializer,
    StringConstraints,
)

_CENT = Decimal("0.01")


class InputModel(BaseModel):
    """Base for request bodies. Unknown fields are rejected with 422."""

    model_config = ConfigDict(extra="forbid")


def _check_two_decimal_places(value: Decimal) -> Decimal:
    try:
        cents = value.quantize(_CENT)
    except InvalidOperation as exc:
        raise ValueError("must have at most two decimal places") from exc
    if cents != value:
        raise ValueError("must have at most two decimal places")
    return cents


def _format_money(value: Decimal) -> str:
    return format(value.quantize(_CENT), "f")


# Money mirrors NUMERIC(12,2). Requests accept a string or a number with at most two decimals.
# JSON responses always carry exactly two decimals, for example "1299.90".
Money = Annotated[
    Decimal,
    Field(ge=0, le=Decimal("9999999999.99")),
    AfterValidator(_check_two_decimal_places),
    PlainSerializer(_format_money, return_type=str, when_used="json"),
]


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


# Timestamps are UTC and serialize as ISO-8601 strings such as "2026-10-08T12:00:00Z".
Iso = Annotated[datetime, AfterValidator(_as_utc)]


def _normalize_email(value: object) -> object:
    return value.strip().lower() if isinstance(value, str) else value


def _check_email_length(value: str) -> str:
    if len(value) > 254:
        raise ValueError("must be at most 254 characters")
    return value


# Emails are trimmed and lowercased before they are validated, then checked for length.
Email = Annotated[
    EmailStr,
    BeforeValidator(_normalize_email),
    AfterValidator(_check_email_length),
]

Password = Annotated[str, StringConstraints(min_length=8, max_length=128)]
FullName = Annotated[str, StringConstraints(min_length=1, max_length=100)]


class Named(BaseModel):
    id: int
    name: str


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int


def reject_null_fields(model: BaseModel, *names: str) -> None:
    """Reject an explicit null for PATCH fields that are NOT NULL in the database.

    Omitted fields are not checked. Nullable columns such as phone or address need no check.
    """
    for name in names:
        if name in model.model_fields_set and getattr(model, name) is None:
            raise ValueError(f"{name} must not be null")
