"""
SmartServe Customer API Router
Protected foundation endpoints for Customer role.
"""

from fastapi import APIRouter, Depends
from app.core.deps import get_current_customer
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/status", summary="Check customer access status")
async def get_customer_status(current_user: User = Depends(get_current_customer)):
    """
    Protected endpoint accessible by Customer users.
    """
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "message": "Welcome to SmartServe Customer Portal",
        "user": UserResponse.model_validate(current_user)
    }
