"""Schemas for product comments."""

from pydantic import BaseModel, Field

from app.schemas.common import InputModel, Iso


class CommentIn(InputModel):
    body: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    author_name: str
    body: str
    created_at: Iso


class MyCommentOut(CommentOut):
    product_name: str


class AdminCommentOut(MyCommentOut):
    author_email: str
