"""
SmartServe Admin API Router
Protected foundation endpoints for Admin role.
"""

from fastapi import APIRouter, Depends
from app.core.deps import get_current_admin
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/status", summary="Check admin access status")
async def get_admin_status(current_user: User = Depends(get_current_admin)):
    """
    Protected endpoint accessible only by Admin users.
    """
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "message": "Welcome to the Admin Portal",
        "user": UserResponse.model_validate(current_user)
    }
