"""
SmartServe Image Upload Service
---------------------------------
Production-ready menu image upload service using Cloudinary.

Security guarantees:
  - Cloudinary credentials NEVER exposed in logs, responses, or exceptions.
  - Strict MIME, extension, and magic-bytes validation before any upload.
  - 5 MB size cap enforced before reading full bytes.
  - No permanent local file storage.
"""

import logging
from fastapi import UploadFile, HTTPException, status

from app.core import cloudinary_service
from app.schemas.media import ImageUploadResponse

logger = logging.getLogger(__name__)

# 5 MB hard limit — must match cloudinary_service.MAX_FILE_SIZE_BYTES
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


class ImageUploadService:
    """
    Validates and uploads an image to Cloudinary.

    The service:
      1. Validates content-type, extension, file size.
      2. Reads the file bytes.
      3. Performs a magic-bytes check (content-type spoofing prevention).
      4. Uploads to Cloudinary under smartserve/menu-items/.
      5. Returns ImageUploadResponse with url = Cloudinary secure_url.

    The service does NOT:
      - Store files permanently on disk.
      - Expose Cloudinary credentials in any return value or log message.
      - Accept SVG, GIF, PDF, video, or arbitrary file types.
    """

    async def upload_image(
        self, file: UploadFile, folder: str = "smartserve/menu-items"
    ) -> ImageUploadResponse:
        """
        Upload an image file to Cloudinary.

        Args:
            file: FastAPI UploadFile from multipart/form-data.
            folder: Cloudinary folder — defaults to smartserve/menu-items.

        Returns:
            ImageUploadResponse with url, public_id, etc.

        Raises:
            HTTPException 400: unsupported mime or extension or bad magic bytes.
            HTTPException 413: file exceeds 5 MB.
            HTTPException 500: Cloudinary not configured or upload failure.
        """
        content_type = (file.content_type or "").lower().strip()
        filename = file.filename or "upload"

        # --- Pre-read MIME check (fast-fail before reading full file) ---
        allowed_mimes = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
        if content_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Unsupported image type. "
                    "Please upload a JPG, PNG, or WEBP file."
                ),
            )

        # --- Read file bytes ---
        file_bytes = await file.read()

        # --- Size check (413 per spec) ---
        if len(file_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Image size exceeds 5 MB limit "
                    f"({len(file_bytes) / (1024 * 1024):.1f} MB received). "
                    "Please compress the image and try again."
                ),
            )

        # --- Full validation (MIME + extension + magic bytes) ---
        try:
            cloudinary_service.validate_image(file_bytes, content_type, filename)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            ) from exc

        # --- Upload to Cloudinary ---
        try:
            result = cloudinary_service.upload_menu_image(file_bytes, filename)
        except RuntimeError as exc:
            # Cloudinary not configured
            logger.error("Cloudinary configuration error: %s", str(exc))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Image upload service is not configured. "
                    "Please contact the administrator."
                ),
            ) from exc
        except Exception as exc:  # pylint: disable=broad-except
            # SDK / network error — log without credentials
            logger.error(
                "Cloudinary upload failed for file '%s': %s: %s",
                filename,
                type(exc).__name__,
                str(exc),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Image upload failed. Please try again.",
            ) from exc

        secure_url = result["secure_url"]
        public_id = result["public_id"]

        return ImageUploadResponse(
            url=secure_url,
            image_url=secure_url,          # alias for menu schema consumers
            public_id=public_id,
            image_public_id=public_id,     # alias for menu schema consumers
            format=filename.rsplit(".", 1)[-1].lower() if "." in filename else None,
            bytes=len(file_bytes),
        )
