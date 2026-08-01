from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.customer import CustomerProfileUpdate, ChangePasswordRequest, GuestAuthResponse

class CustomerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def create_guest_session(self, session_id: Optional[str] = None) -> GuestAuthResponse:
        sid = session_id or f"guest-{str(uuid.uuid4())[:12]}"
        access_token = create_access_token(
            subject=sid,
            expires_delta=timedelta(days=7),
            extra_claims={"role": "customer", "is_guest": True, "session_id": sid}
        )
        return GuestAuthResponse(
            session_id=sid,
            access_token=access_token,
            token_type="bearer",
            expires_in=604800
        )

    async def update_profile(self, user_id: uuid.UUID, data: CustomerProfileUpdate):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

        update_dict = data.model_dump(exclude_unset=True)
        if "name" in update_dict and update_dict["name"]:
            user.full_name = update_dict["name"]
        if "phone" in update_dict and update_dict["phone"]:
            user.phone = update_dict["phone"]
        if "avatar_url" in update_dict and update_dict["avatar_url"]:
            user.avatar_url = update_dict["avatar_url"]

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(self, user_id: uuid.UUID, data: ChangePasswordRequest):
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.hashed_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account password invalid")

        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")

        user.hashed_password = get_password_hash(data.new_password)
        self.db.add(user)
        await self.db.commit()
        return {"status": "success", "message": "Password changed successfully"}

    async def delete_account(self, user_id: uuid.UUID):
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.is_active = False
        self.db.add(user)
        await self.db.commit()
        return {"status": "success", "message": "Account deactivated successfully"}
