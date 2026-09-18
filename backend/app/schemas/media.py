from pydantic import BaseModel
from typing import Optional


class ImageUploadResponse(BaseModel):
    """
    Response schema for a successful image upload.

    `url` is always the Cloudinary secure_url (HTTPS).
    `image_url` is an alias — same value — provided for menu schema compatibility.
    `public_id` is the Cloudinary public_id used for future deletion/management.
    `image_public_id` is an alias — same value — for schema consistency.
    """
    url: str
    image_url: Optional[str] = None   # alias for menu schema consumers
    public_id: Optional[str] = None
    image_public_id: Optional[str] = None  # alias for menu schema consumers
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    bytes: Optional[int] = None
