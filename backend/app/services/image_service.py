import os
import uuid
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.schemas.media import ImageUploadResponse

class ImageUploadService:
    def __init__(self):
        self.cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        self.api_key = os.getenv("CLOUDINARY_API_KEY")
        self.api_secret = os.getenv("CLOUDINARY_API_SECRET")

    async def upload_image(self, file: UploadFile, folder: str = "smartserve") -> ImageUploadResponse:
        # Validate content type
        content_type = file.content_type or ""
        if not content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed."
            )

        # Read file bytes
        file_bytes = await file.read()
        if len(file_bytes) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB."
            )

        # Check Cloudinary configuration
        if self.cloud_name and self.api_key and self.api_secret:
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=self.cloud_name,
                    api_key=self.api_key,
                    api_secret=self.api_secret,
                    secure=True,
                )
                res = cloudinary.uploader.upload(
                    file_bytes,
                    folder=folder,
                    resource_type="image"
                )
                return ImageUploadResponse(
                    url=res.get("secure_url") or res.get("url"),
                    public_id=res.get("public_id"),
                    width=res.get("width"),
                    height=res.get("height"),
                    format=res.get("format"),
                    bytes=res.get("bytes")
                )
            except Exception as e:
                # Fallback to local upload on Cloudinary failure
                pass

        # Local storage fallback
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(file_bytes)

        url = f"/uploads/{filename}"
        return ImageUploadResponse(
            url=url,
            public_id=filename,
            bytes=len(file_bytes),
            format=ext
        )

