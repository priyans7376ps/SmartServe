from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime

class CategoryCreate(BaseModel):
    restaurant_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = Field(0, ge=0)
    is_featured: bool = False
    is_active: bool = True
    parent_id: Optional[uuid.UUID] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None

class CategoryReorderItem(BaseModel):
    id: uuid.UUID
    display_order: int

class CategoryReorderRequest(BaseModel):
    orders: List[CategoryReorderItem]

class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_featured: bool = False
    is_active: bool = True
    parent_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
