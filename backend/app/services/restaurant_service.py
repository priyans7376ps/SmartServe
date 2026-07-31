from typing import List, Optional
import uuid
import re
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.restaurant_repository import RestaurantRepository
from app.schemas.restaurant import (
    RestaurantCreate, RestaurantUpdate, RestaurantSettingsUpdate, RestaurantStatusUpdate, RestaurantResponse
)
from app.models.restaurant import Restaurant

class RestaurantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RestaurantRepository(db)

    def _generate_slug(self, name: str) -> str:
        slug = re.sub(r'[^\w\s-]', '', name.lower()).strip()
        return re.sub(r'[-\s]+', '-', slug)

    async def create_restaurant(self, data: RestaurantCreate) -> RestaurantResponse:
        slug = data.slug or self._generate_slug(data.name)
        existing = await self.repo.get_by_slug(slug)
        if existing:
            import uuid as uuid_mod
            slug = f"{slug}-{uuid_mod.uuid4().hex[:6]}"

        restaurant_dict = data.model_dump()
        restaurant_dict["slug"] = slug
        restaurant_dict.setdefault("is_open", True)
        restaurant_dict.setdefault("is_active", True)

        restaurant = await self.repo.create(restaurant_dict)
        return RestaurantResponse.model_validate(restaurant)

    async def get_restaurant(self, restaurant_id: uuid.UUID) -> RestaurantResponse:
        restaurant = await self.repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )
        return RestaurantResponse.model_validate(restaurant)

    async def list_restaurants(self, skip: int = 0, limit: int = 100) -> List[RestaurantResponse]:
        restaurants = await self.repo.get_active_restaurants(skip=skip, limit=limit)
        return [RestaurantResponse.model_validate(r) for r in restaurants]

    async def update_restaurant(self, restaurant_id: uuid.UUID, data: RestaurantUpdate) -> RestaurantResponse:
        restaurant = await self.repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )

        update_dict = data.model_dump(exclude_unset=True)
        if "name" in update_dict and not update_dict.get("slug"):
            update_dict["slug"] = self._generate_slug(update_dict["name"])

        updated = await self.repo.update(restaurant, update_dict)
        return RestaurantResponse.model_validate(updated)

    async def update_settings(self, restaurant_id: uuid.UUID, data: RestaurantSettingsUpdate) -> RestaurantResponse:
        restaurant = await self.repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )

        update_dict = data.model_dump(exclude_unset=True)
        updated = await self.repo.update(restaurant, update_dict)
        return RestaurantResponse.model_validate(updated)

    async def update_status(self, restaurant_id: uuid.UUID, data: RestaurantStatusUpdate) -> RestaurantResponse:
        restaurant = await self.repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )

        update_dict = data.model_dump(exclude_unset=True)
        updated = await self.repo.update(restaurant, update_dict)
        return RestaurantResponse.model_validate(updated)

    async def delete_restaurant(self, restaurant_id: uuid.UUID) -> bool:
        restaurant = await self.repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )
        await self.repo.update(restaurant, {"is_active": False})
        return True
