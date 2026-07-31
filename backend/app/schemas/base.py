from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
import uuid

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class BaseResponseSchema(BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
