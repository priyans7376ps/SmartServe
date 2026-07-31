from typing import Optional, List, Tuple, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from app.models.menu import MenuItem
from app.repositories.base import BaseRepository

class MenuRepository(BaseRepository[MenuItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(MenuItem, db)

    async def get_by_slug(self, restaurant_id: uuid.UUID, slug: str) -> Optional[MenuItem]:
        result = await self.db.execute(
            select(MenuItem).filter(
                MenuItem.restaurant_id == restaurant_id,
                MenuItem.slug == slug
            )
        )
        return result.scalars().first()

    async def search_and_filter(
        self,
        restaurant_id: Optional[uuid.UUID] = None,
        category_id: Optional[uuid.UUID] = None,
        search_query: Optional[str] = None,
        is_veg: Optional[bool] = None,
        is_non_veg: Optional[bool] = None,
        is_available: Optional[bool] = None,
        is_todays_special: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "display_order",
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[MenuItem], int]:
        query = select(MenuItem)
        conditions = [MenuItem.is_active == True]

        if restaurant_id:
            conditions.append(MenuItem.restaurant_id == restaurant_id)
        if category_id:
            conditions.append(MenuItem.category_id == category_id)

        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            conditions.append(
                or_(
                    MenuItem.name.ilike(term),
                    MenuItem.description.ilike(term),
                    MenuItem.short_description.ilike(term),
                )
            )

        if is_veg is True:
            conditions.append(MenuItem.is_vegetarian == True)
        elif is_non_veg is True:
            conditions.append(MenuItem.is_vegetarian == False)

        if is_available is not None:
            conditions.append(MenuItem.is_available == is_available)
        if is_todays_special is not None:
            conditions.append(MenuItem.is_todays_special == is_todays_special)
        if is_featured is not None:
            conditions.append(MenuItem.is_featured == is_featured)

        if min_price is not None:
            conditions.append(MenuItem.price >= min_price)
        if max_price is not None:
            conditions.append(MenuItem.price <= max_price)

        query = query.filter(and_(*conditions))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(MenuItem.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(MenuItem.price.desc())
        elif sort_by == "rating":
            query = query.order_by(MenuItem.rating.desc())
        elif sort_by == "newest":
            query = query.order_by(MenuItem.created_at.desc())
        else:
            query = query.order_by(MenuItem.display_order.asc(), MenuItem.name.asc())

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total
