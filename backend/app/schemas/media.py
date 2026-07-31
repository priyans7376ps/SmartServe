from pydantic import BaseModel
from typing import Optional

class ImageUploadResponse(BaseModel):
    url: str
    public_id: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    bytes: Optional[int] = None
