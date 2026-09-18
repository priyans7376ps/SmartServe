from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any
import uuid
from datetime import datetime

class MenuItemCreate(BaseModel):
    restaurant_id: Optional[uuid.UUID] = None
    category_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float = Field(..., ge=0.0)
    compare_price: Optional[float] = Field(None, ge=0.0)
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None  # Cloudinary public_id for asset management
    is_available: bool = True
    is_todays_special: bool = False
    is_featured: bool = False
    is_vegetarian: bool = False
    preparation_time: int = Field(15, ge=1)
    tags: Optional[List[str]] = None

    @field_validator("compare_price", mode="before")
    @classmethod
    def parse_compare_price(cls, v: Any) -> Optional[float]:
        if v == "" or v is None:
            return None
        return float(v)

    @field_validator("price", mode="before")
    @classmethod
    def parse_price(cls, v: Any) -> float:
        if v == "" or v is None:
            raise ValueError("Price is required.")
        return float(v)

    @field_validator("preparation_time", mode="before")
    @classmethod
    def parse_prep_time(cls, v: Any) -> int:
        if v == "" or v is None:
            return 15
        return int(v)

    @field_validator("is_available", "is_todays_special", "is_featured", "is_vegetarian", mode="before")
    @classmethod
    def parse_booleans(cls, v: Any) -> bool:
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return bool(v) if v is not None else False

class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[uuid.UUID] = None
    restaurant_id: Optional[uuid.UUID] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    compare_price: Optional[float] = Field(None, ge=0.0)
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None  # Cloudinary public_id for asset management
    is_available: Optional[bool] = None
    is_todays_special: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    preparation_time: Optional[int] = Field(None, ge=1)
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

    @field_validator("compare_price", mode="before")
    @classmethod
    def parse_compare_price(cls, v: Any) -> Optional[float]:
        if v == "" or v is None:
            return None
        return float(v)

    @field_validator("price", mode="before")
    @classmethod
    def parse_price(cls, v: Any) -> Optional[float]:
        if v == "" or v is None:
            return None
        return float(v)

    @field_validator("preparation_time", mode="before")
    @classmethod
    def parse_prep_time(cls, v: Any) -> Optional[int]:
        if v == "" or v is None:
            return None
        return int(v)

    @field_validator("is_available", "is_todays_special", "is_featured", "is_vegetarian", "is_active", mode="before")
    @classmethod
    def parse_booleans(cls, v: Any) -> Optional[bool]:
        if v is None or v == "":
            return None
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return bool(v)

class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    category_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None  # Cloudinary public_id — included in all menu responses
    is_available: bool = True
    is_active: bool = True
    is_todays_special: bool = False
    is_featured: bool = False
    is_vegetarian: bool = False
    preparation_time: int = 15
    rating: float = 0.0
    rating_count: int = 0
    display_order: int = 0
    created_at: Optional[datetime] = None

class PaginatedMenuItemResponse(BaseModel):
    items: List[MenuItemResponse]
    total: int
    page: int
    limit: int
    pages: int
