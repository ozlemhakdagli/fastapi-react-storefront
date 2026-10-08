"""Schema for the single site settings row, used for both GET and PUT."""

from pydantic import Field

from app.schemas.common import InputModel


class SiteSettings(InputModel):
    # Extra keys are rejected, so build this from the ten settings columns only.
    # Do not pass the table's `id` column in when producing the GET response.
    site_name: str = Field(max_length=100)
    description: str = Field(max_length=500)
    address: str = Field(max_length=500)
    phone: str = Field(max_length=30)
    email: str = Field(max_length=254)
    facebook: str = Field(max_length=200)
    instagram: str = Field(max_length=200)
    pinterest: str = Field(max_length=200)
    about_text: str = Field(max_length=20000)
    contact_text: str = Field(max_length=20000)
