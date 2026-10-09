"""Schemas for star ratings."""

from typing import Annotated

from pydantic import BaseModel, Field

from app.schemas.common import InputModel


class RatingIn(InputModel):
    # Strict: only a JSON integer from 1 to 5. "5", 4.5 and true are refused with 422.
    rating: Annotated[int, Field(strict=True, ge=1, le=5)]


class RatingOut(BaseModel):
    # rating is null without a rating; can_rate is true when a completed order holds the product.
    rating: int | None
    can_rate: bool
