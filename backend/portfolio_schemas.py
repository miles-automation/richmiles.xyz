from pydantic import BaseModel, Field
from pydantic import field_validator


class ContactLink(BaseModel):
    label: str
    href: str
    icon: str


class ProfileResponse(BaseModel):
    name: str
    tagline: str
    description: str
    photo_url: str
    cta_label: str
    location: str
    contact_links: list[ContactLink] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    date: str
    title: str
    company: str
    description: str


class ExperienceListResponse(BaseModel):
    items: list[ExperienceItem]


class LeadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=1, max_length=320)
    company: str | None = Field(default=None, max_length=200)
    message: str | None = Field(default=None, max_length=5000)
    website: str | None = Field(default=None, max_length=200)

    @field_validator("name", "email")
    @classmethod
    def validate_non_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_email_contains_at(cls, value: str) -> str:
        if "@" not in value:
            raise ValueError("must contain @")
        return value
