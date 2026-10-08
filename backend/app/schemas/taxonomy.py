"""Schemas for categories and brands, which share one shape."""

from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.common import InputModel

# Names are trimmed, so a blank or whitespace-only name is rejected and " Shoes " equals "Shoes".
TaxonomyName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class TaxonomyIn(InputModel):
    name: TaxonomyName
    description: str = Field(default="", max_length=2000)


class TaxonomyOut(BaseModel):
    id: int
    name: str
    description: str
