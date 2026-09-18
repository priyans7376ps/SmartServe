"""
SmartServe Cloudinary Service
------------------------------
Handles all interactions with the Cloudinary CDN for menu image upload and deletion.

Security rules enforced here:
  - Credentials NEVER hardcoded — loaded from settings (backed by .env).
  - Credentials NEVER logged or returned to callers.
  - The API secret is only used server-side for signed upload requests.

Usage:
    from app.core.cloudinary_service import upload_menu_image, delete_menu_image
"""

import io
import logging
from typing import Dict, Any, Optional

import cloudinary
import cloudinary.uploader
import cloudinary.api

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MENU_IMAGE_FOLDER = "smartserve/menu-items"

ALLOWED_MIMES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# Magic bytes for fast client-side forgery detection
_MAGIC_SIGNATURES: Dict[bytes, str] = {
    b"\xff\xd8\xff": "jpeg",          # JPEG / JPG
    b"\x89PNG\r\n\x1a\n": "png",     # PNG
    b"RIFF": "webp",                   # WEBP (checked further below)
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _configure() -> bool:
    """Configure cloudinary SDK from app settings. Returns True if ready."""
    if not (settings.CLOUDINARY_CLOUD_NAME and
            settings.CLOUDINARY_API_KEY and
            settings.CLOUDINARY_API_SECRET):
        return False
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return True


def _detect_mime_from_bytes(data: bytes) -> Optional[str]:
    """
    Detect image type from the first bytes (magic bytes check).
    Returns a normalised mime string or None if unrecognised.
    """
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def validate_image(
    file_bytes: bytes,
    content_type: str,
    filename: str,
) -> None:
    """
    Validate an uploaded image.

    Raises:
        ValueError: with a user-friendly message on validation failure.
    """
    # 1. File size
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"Image size exceeds 5 MB limit "
            f"({len(file_bytes) / (1024 * 1024):.1f} MB received)."
        )

    # 2. MIME type from Content-Type header
    normalised_mime = (content_type or "").lower().strip()
    if normalised_mime not in ALLOWED_MIMES:
        raise ValueError(
            "Unsupported image type. Please upload a JPG, PNG, or WEBP file."
        )

    # 3. File extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension '.{ext}'. "
            "Allowed: .jpg, .jpeg, .png, .webp"
        )

    # 4. Magic bytes — prevents content-type spoofing
    detected_mime = _detect_mime_from_bytes(file_bytes)
    if detected_mime is None:
        raise ValueError(
            "File content does not match a recognised image format. "
            "Please upload a valid JPG, PNG, or WEBP file."
        )
    # Cross-check detected mime against declared mime (allow jpeg/jpg aliases)
    _declared_base = normalised_mime.replace("image/jpg", "image/jpeg")
    _detected_base = detected_mime.replace("image/jpg", "image/jpeg")
    if _declared_base != _detected_base:
        raise ValueError(
            "File content does not match its declared type. "
            "Please upload a genuine JPG, PNG, or WEBP image."
        )


def upload_menu_image(file_bytes: bytes, filename: str) -> Dict[str, str]:
    """
    Upload image bytes to Cloudinary under the smartserve/menu-items folder.

    Returns:
        {
            "secure_url": "https://res.cloudinary.com/...",
            "public_id": "smartserve/menu-items/<unique-id>"
        }

    Raises:
        RuntimeError: if Cloudinary is not configured.
        Exception: propagated from Cloudinary SDK on upload failure.
    """
    if not _configure():
        raise RuntimeError(
            "Cloudinary is not configured. "
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, "
            "and CLOUDINARY_API_SECRET in backend/.env"
        )

    result = cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        folder=MENU_IMAGE_FOLDER,
        resource_type="image",
        # Quality and format auto-optimisation for fast delivery
        quality="auto",
        fetch_format="auto",
    )

    secure_url = result.get("secure_url") or result.get("url", "")
    public_id = result.get("public_id", "")

    logger.info(
        "Menu image uploaded to Cloudinary — public_id=%s",
        public_id,
    )

    return {
        "secure_url": secure_url,
        "public_id": public_id,
    }


def delete_menu_image(public_id: str) -> bool:
    """
    Delete a Cloudinary asset by public_id.

    Returns True on success, False if skipped / failed.
    Never raises — cleanup failures are logged but must not block callers.
    Credentials are never included in log messages.
    """
    if not public_id:
        return False

    if not _configure():
        logger.warning(
            "Cloudinary not configured — cannot delete asset public_id=%s",
            public_id,
        )
        return False

    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        success = result.get("result") == "ok"
        if success:
            logger.info("Cloudinary asset deleted — public_id=%s", public_id)
        else:
            logger.warning(
                "Cloudinary delete returned non-ok result for public_id=%s: %s",
                public_id,
                result.get("result"),
            )
        return success
    except Exception as exc:  # pylint: disable=broad-except
        # Log without credentials
        logger.error(
            "Failed to delete Cloudinary asset public_id=%s — %s: %s",
            public_id,
            type(exc).__name__,
            str(exc),
        )
        return False
