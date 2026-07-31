from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict
import uuid
from datetime import datetime, time

class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    tagline: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "US"
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    currency: str = "USD"
    tax_rate: float = Field(0.08, ge=0.0, le=1.0)
    service_charge_rate: float = Field(0.05, ge=0.0, le=1.0)

class RestaurantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_open: Optional[bool] = None

class RestaurantSettingsUpdate(BaseModel):
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    tax_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    service_charge_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    preparation_time_buffer: Optional[int] = Field(None, ge=0)
    max_items_per_order: Optional[int] = Field(None, ge=1)
    order_timeout_minutes: Optional[int] = Field(None, ge=1)
    enable_online_ordering: Optional[bool] = None
    enable_table_reservation: Optional[bool] = None

class RestaurantStatusUpdate(BaseModel):
    is_open: Optional[bool] = None
    is_active: Optional[bool] = None

class RestaurantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    is_open: bool = True
    is_active: bool = True
    currency: str = "USD"
    tax_rate: float = 0.08
    service_charge_rate: float = 0.05
    created_at: Optional[datetime] = None
