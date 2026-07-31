from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import uuid
from datetime import datetime

class TableCreate(BaseModel):
    restaurant_id: uuid.UUID
    table_number: int = Field(..., ge=1)
    table_name: Optional[str] = None
    section: Optional[str] = "indoor"
    capacity: int = Field(4, ge=1, le=50)
    device_id: Optional[str] = None
    qr_code: Optional[str] = None
    status: str = "available"

class TableUpdate(BaseModel):
    table_number: Optional[int] = Field(None, ge=1)
    table_name: Optional[str] = None
    section: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1, le=50)
    device_id: Optional[str] = None
    qr_code: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

class TableStatusUpdate(BaseModel):
    status: str = Field(..., description="Status: available, occupied, reserved, inactive")

class TableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    restaurant_id: uuid.UUID
    table_number: int
    table_name: Optional[str] = None
    section: Optional[str] = None
    capacity: int
    device_id: Optional[str] = None
    qr_code: Optional[str] = None
    qr_code_url: Optional[str] = None
    status: str = "available"
    is_occupied: bool = False
    is_active: bool = True
    is_reserved: bool = False
    created_at: Optional[datetime] = None
