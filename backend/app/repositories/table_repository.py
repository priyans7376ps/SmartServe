from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.table import Table
from app.repositories.base import BaseRepository

class TableRepository(BaseRepository[Table]):
    def __init__(self, db: AsyncSession):
        super().__init__(Table, db)

    async def get_by_restaurant(self, restaurant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Table]:
        result = await self.db.execute(
            select(Table)
            .filter(Table.restaurant_id == restaurant_id, Table.is_active == True)
            .order_by(Table.table_number.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_table_number(self, restaurant_id: uuid.UUID, table_number: int) -> Optional[Table]:
        result = await self.db.execute(
            select(Table).filter(
                Table.restaurant_id == restaurant_id,
                Table.table_number == table_number
            )
        )
        return result.scalars().first()
