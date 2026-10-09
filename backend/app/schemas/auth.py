"""Schemas for registration, login, the current profile and password changes."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.schemas.common import Email, FullName, InputModel, Password, reject_null_fields
from app.schemas.users import UserOut


class RegisterIn(InputModel):
    email: Email
    password: Password
    full_name: FullName
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)


class LoginIn(InputModel):
    # Only trimmed and lowercased, not syntax-checked like new addresses: an account created by the
    # seed with a reserved domain such as admin@shop.local must still be able to log in, and a
    # wrong address must give 401 invalid_credentials, not a validation error.
    email: Annotated[
        str, StringConstraints(strip_whitespace=True, to_lower=True, min_length=1, max_length=254)
    ]
    # Not 8..128 like new passwords, so a short wrong password gets 401 invalid_credentials.
    password: str = Field(min_length=1, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    # "bearer" is the OAuth2 token type, not a secret (S105 false positive).
    token_type: Literal["bearer"] = "bearer"  # noqa: S105
    user: UserOut


class ProfileUpdateIn(InputModel):
    full_name: FullName | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _reject_null_name(self) -> Self:
        reject_null_fields(self, "full_name")
        return self


class ChangePasswordIn(InputModel):
    # Not 8..128 like new passwords, so a short wrong current password gets 400 wrong_password.
    current_password: str = Field(min_length=1, max_length=128)
    new_password: Password
