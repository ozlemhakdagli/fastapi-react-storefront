"""Schemas for product comments."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.common import InputModel, Iso


class CommentIn(InputModel):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class CommentOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    author_name: str
    body: str
    created_at: Iso
    # The current star rating of the author for this product, or None when the author has not rated.
    rating: int | None


class MyCommentOut(CommentOut):
    product_name: str


class AdminCommentOut(MyCommentOut):
    author_email: str
