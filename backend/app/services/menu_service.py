from typing import List, Optional, Tuple
import uuid
import re
import math
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.menu_repository import MenuRepository
from app.repositories.restaurant_repository import RestaurantRepository
from app.repositories.category_repository import CategoryRepository
from app.schemas.menu import MenuItemCreate, MenuItemUpdate, MenuItemResponse, PaginatedMenuItemResponse
from app.core import cloudinary_service

logger = logging.getLogger(__name__)


class MenuService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = MenuRepository(db)
        self.restaurant_repo = RestaurantRepository(db)
        self.category_repo = CategoryRepository(db)

    def _generate_slug(self, name: str) -> str:
        slug = re.sub(r'[^\w\s-]', '', name.lower()).strip()
        return re.sub(r'[-\s]+', '-', slug)

    async def create_menu_item(self, data: MenuItemCreate) -> MenuItemResponse:
        category = await self.category_repo.get_by_id(data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found."
            )

        restaurant_id = data.restaurant_id or category.restaurant_id
        if not restaurant_id:
            rests = await self.restaurant_repo.get_all(limit=1)
            if rests:
                restaurant_id = rests[0].id
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active restaurant found."
                )

        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )

        slug = data.slug or self._generate_slug(data.name)
        existing = await self.repo.get_by_slug(restaurant_id, slug)
        if existing:
            import uuid as uuid_mod
            slug = f"{slug}-{uuid_mod.uuid4().hex[:6]}"

        item_dict = data.model_dump()
        item_dict["restaurant_id"] = restaurant_id
        item_dict["slug"] = slug
        item_dict.setdefault("is_available", True)
        item_dict.setdefault("is_active", True)
        item_dict.setdefault("is_todays_special", False)
        item_dict.setdefault("is_featured", False)
        item_dict.setdefault("is_vegetarian", False)
        item_dict.setdefault("rating", 0.0)
        item_dict.setdefault("rating_count", 0)
        item_dict.setdefault("display_order", 0)

        item = await self.repo.create(item_dict)
        return MenuItemResponse.model_validate(item)

    async def get_menu_item(self, item_id: uuid.UUID) -> MenuItemResponse:
        item = await self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found."
            )
        return MenuItemResponse.model_validate(item)

    async def list_menu_items(
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
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedMenuItemResponse:
        page = max(1, page)
        limit = max(1, min(limit, 100))
        skip = (page - 1) * limit

        items, total = await self.repo.search_and_filter(
            restaurant_id=restaurant_id,
            category_id=category_id,
            search_query=search_query,
            is_veg=is_veg,
            is_non_veg=is_non_veg,
            is_available=is_available,
            is_todays_special=is_todays_special,
            is_featured=is_featured,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )

        pages = math.ceil(total / limit) if total > 0 else 0

        return PaginatedMenuItemResponse(
            items=[MenuItemResponse.model_validate(i) for i in items],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    async def update_menu_item(self, item_id: uuid.UUID, data: MenuItemUpdate) -> MenuItemResponse:
        item = await self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found."
            )

        update_dict = data.model_dump(exclude_unset=True)
        if "name" in update_dict and not update_dict.get("slug"):
            update_dict["slug"] = self._generate_slug(update_dict["name"])

        # --- Cloudinary old-image cleanup on image replacement ---
        # Only delete old Cloudinary asset AFTER the DB update succeeds.
        old_public_id: Optional[str] = None
        new_public_id = update_dict.get("image_public_id")
        existing_public_id = getattr(item, "image_public_id", None)

        if (
            new_public_id                                # new image is being set
            and existing_public_id                       # old image existed in Cloudinary
            and new_public_id != existing_public_id      # it's actually different
        ):
            old_public_id = existing_public_id

        updated = await self.repo.update(item, update_dict)

        # Delete old Cloudinary asset AFTER successful DB commit
        if old_public_id:
            deleted = cloudinary_service.delete_menu_image(old_public_id)
            if not deleted:
                # Log but do NOT undo the successful update
                logger.warning(
                    "Could not delete old Cloudinary asset public_id=%s "
                    "after updating menu item id=%s. Manual cleanup may be needed.",
                    old_public_id,
                    str(item_id),
                )

        return MenuItemResponse.model_validate(updated)

    async def delete_menu_item(self, item_id: uuid.UUID) -> bool:
        item = await self.repo.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found."
            )

        # Capture public_id before DB update
        public_id: Optional[str] = getattr(item, "image_public_id", None)

        # Soft-delete in DB first
        await self.repo.update(item, {"is_active": False, "is_available": False})

        # Attempt Cloudinary cleanup AFTER successful DB update
        # A cleanup failure must NOT block the deletion response.
        if public_id:
            deleted = cloudinary_service.delete_menu_image(public_id)
            if not deleted:
                logger.warning(
                    "Could not delete Cloudinary asset public_id=%s "
                    "for deleted menu item id=%s. Manual cleanup may be needed.",
                    public_id,
                    str(item_id),
                )

        return True
