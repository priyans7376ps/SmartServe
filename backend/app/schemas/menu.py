from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime

class MenuItemCreate(BaseModel):
    restaurant_id: uuid.UUID
    category_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float = Field(..., ge=0.0)
    compare_price: Optional[float] = Field(None, ge=0.0)
    image_url: Optional[str] = None
    is_available: bool = True
    is_todays_special: bool = False
    is_featured: bool = False
    is_vegetarian: bool = False
    preparation_time: int = Field(15, ge=1)
    tags: Optional[List[str]] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[uuid.UUID] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    compare_price: Optional[float] = Field(None, ge=0.0)
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_todays_special: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    preparation_time: Optional[int] = Field(None, ge=1)
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

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
