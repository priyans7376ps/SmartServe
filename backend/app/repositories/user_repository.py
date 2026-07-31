from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def get_by_phone(self, phone: str) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.phone == phone))
        return result.scalars().first()

    async def update_refresh_token(self, user_id: str, token: Optional[str]) -> Optional[User]:
        user = await self.get_by_id(user_id)
        if user:
            user.refresh_token = token
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        return user
