from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.restaurant import Restaurant
from app.repositories.base import BaseRepository

class RestaurantRepository(BaseRepository[Restaurant]):
    def __init__(self, db: AsyncSession):
        super().__init__(Restaurant, db)

    async def get_by_slug(self, slug: str) -> Optional[Restaurant]:
        result = await self.db.execute(select(Restaurant).filter(Restaurant.slug == slug))
        return result.scalars().first()

    async def get_active_restaurants(self, skip: int = 0, limit: int = 100) -> List[Restaurant]:
        result = await self.db.execute(
            select(Restaurant)
            .filter(Restaurant.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
