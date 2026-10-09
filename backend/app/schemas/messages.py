"""Schemas for contact messages and admin replies."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.schemas.common import Email, InputModel, Iso, reject_null_fields

MessageDirection = Literal["inbound", "outbound"]
MessageStatus = Literal["new", "read"]


class ContactIn(InputModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    email: Email
    phone: str | None = Field(default=None, max_length=30)
    subject: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]


class MessageOut(BaseModel):
    id: int
    direction: MessageDirection
    subject: str
    body: str
    status: MessageStatus
    name: str
    email: str
    created_at: Iso


class AdminMessageOut(MessageOut):
    phone: str | None
    user_id: int | None
    admin_note: str | None


class AdminMessageCreateIn(InputModel):
    user_id: int
    subject: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]


class AdminMessageUpdateIn(InputModel):
    status: MessageStatus | None = None
    admin_note: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _reject_null_status(self) -> Self:
        reject_null_fields(self, "status")
        return self
