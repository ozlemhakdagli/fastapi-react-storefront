"""Schemas for favourite products."""

from pydantic import BaseModel


class FavoriteIdsOut(BaseModel):
    ids: list[int]
