from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.category import Category
from app.repositories.base import BaseRepository

class CategoryRepository(BaseRepository[Category]):
    def __init__(self, db: AsyncSession):
        super().__init__(Category, db)

    async def get_by_restaurant(
        self, restaurant_id: uuid.UUID, active_only: bool = True, skip: int = 0, limit: int = 100
    ) -> List[Category]:
        query = select(Category).filter(Category.restaurant_id == restaurant_id)
        if active_only:
            query = query.filter(Category.is_active == True)
        query = query.order_by(Category.display_order.asc(), Category.name.asc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_slug(self, restaurant_id: uuid.UUID, slug: str) -> Optional[Category]:
        result = await self.db.execute(
            select(Category).filter(
                Category.restaurant_id == restaurant_id,
                Category.slug == slug
            )
        )
        return result.scalars().first()
