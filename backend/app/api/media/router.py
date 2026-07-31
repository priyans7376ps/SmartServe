from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from app.core.deps import get_current_kitchen
from app.models.user import User
from app.services.image_service import ImageUploadService
from app.schemas.media import ImageUploadResponse

router = APIRouter()

@router.post("/upload", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED, summary="Upload an image (Cloudinary storage abstraction)")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form("smartserve"),
    staff: User = Depends(get_current_kitchen)
):
    service = ImageUploadService()
    return await service.upload_image(file, folder=folder)
