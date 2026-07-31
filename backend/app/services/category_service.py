from typing import List, Optional
import uuid
import re
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.category_repository import CategoryRepository
from app.repositories.restaurant_repository import RestaurantRepository
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryReorderRequest, CategoryResponse

class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CategoryRepository(db)
        self.restaurant_repo = RestaurantRepository(db)

    def _generate_slug(self, name: str) -> str:
        slug = re.sub(r'[^\w\s-]', '', name.lower()).strip()
        return re.sub(r'[-\s]+', '-', slug)

    async def create_category(self, data: CategoryCreate) -> CategoryResponse:
        restaurant = await self.restaurant_repo.get_by_id(data.restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )

        slug = data.slug or self._generate_slug(data.name)
        existing = await self.repo.get_by_slug(data.restaurant_id, slug)
        if existing:
            import uuid as uuid_mod
            slug = f"{slug}-{uuid_mod.uuid4().hex[:6]}"

        category_dict = data.model_dump()
        category_dict["slug"] = slug
        category_dict.setdefault("is_active", True)
        category_dict.setdefault("is_featured", False)

        category = await self.repo.create(category_dict)
        return CategoryResponse.model_validate(category)

    async def get_category(self, category_id: uuid.UUID) -> CategoryResponse:
        category = await self.repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )
        return CategoryResponse.model_validate(category)

    async def list_categories(
        self, restaurant_id: uuid.UUID, active_only: bool = True, skip: int = 0, limit: int = 100
    ) -> List[CategoryResponse]:
        categories = await self.repo.get_by_restaurant(restaurant_id, active_only=active_only, skip=skip, limit=limit)
        return [CategoryResponse.model_validate(c) for c in categories]

    async def update_category(self, category_id: uuid.UUID, data: CategoryUpdate) -> CategoryResponse:
        category = await self.repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )

        update_dict = data.model_dump(exclude_unset=True)
        if "name" in update_dict and not update_dict.get("slug"):
            update_dict["slug"] = self._generate_slug(update_dict["name"])

        updated = await self.repo.update(category, update_dict)
        return CategoryResponse.model_validate(updated)

    async def reorder_categories(self, data: CategoryReorderRequest) -> List[CategoryResponse]:
        updated_categories = []
        for item in data.orders:
            cat = await self.repo.get_by_id(item.id)
            if cat:
                upd = await self.repo.update(cat, {"display_order": item.display_order})
                updated_categories.append(CategoryResponse.model_validate(upd))
        return updated_categories

    async def delete_category(self, category_id: uuid.UUID) -> bool:
        category = await self.repo.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )
        await self.repo.update(category, {"is_active": False})
        return True
