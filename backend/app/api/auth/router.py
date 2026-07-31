from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import UserSignup, UserLogin, TokenResponse, RefreshTokenRequest, UserResponse, GuestLoginRequest
from app.models.user import User

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(signup_data: UserSignup, db: AsyncSession = Depends(get_db)):
    """Register a new user (Customer, Kitchen, or Admin)."""
    service = AuthService(db)
    return await service.signup(signup_data)

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    service = AuthService(db)
    return await service.login(login_data)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(token_data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access & refresh tokens."""
    service = AuthService(db)
    return await service.refresh_tokens(token_data.refresh_token)

@router.post("/guest", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def guest_login(
    guest_data: Optional[GuestLoginRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """Guest Login placeholder endpoint for table/dine-in sessions."""
    service = AuthService(db)
    table_id = str(guest_data.table_id) if guest_data and guest_data.table_id else None
    restaurant_id = str(guest_data.restaurant_id) if guest_data and guest_data.restaurant_id else None
    device_id = guest_data.device_id if guest_data else None
    return await service.guest_login(table_id=table_id, restaurant_id=restaurant_id, device_id=device_id)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile of current authenticated user."""
    return UserResponse.model_validate(current_user)

