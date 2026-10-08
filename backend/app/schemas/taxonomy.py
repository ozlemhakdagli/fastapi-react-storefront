"""Schemas for categories and brands, which share one shape."""

from pydantic import BaseModel, Field

from app.schemas.common import InputModel


class TaxonomyIn(InputModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)


class TaxonomyOut(BaseModel):
    id: int
    name: str
    description: str
