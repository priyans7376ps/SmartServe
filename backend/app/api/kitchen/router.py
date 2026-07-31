"""
SmartServe Kitchen API Router
Protected foundation endpoints for Kitchen role.
"""

from fastapi import APIRouter, Depends
from app.core.deps import get_current_kitchen
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/status", summary="Check kitchen access status")
async def get_kitchen_status(current_user: User = Depends(get_current_kitchen)):
    """
    Protected endpoint accessible only by Kitchen staff and Admins.
    """
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "message": "Welcome to the Kitchen Display System",
        "user": UserResponse.model_validate(current_user)
    }
