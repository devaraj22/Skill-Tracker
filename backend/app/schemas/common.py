from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StrictIn(BaseModel):
    """Base for request bodies: trims strings and rejects unknown fields."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
