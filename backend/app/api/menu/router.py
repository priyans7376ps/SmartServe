from typing import Optional, List
import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_kitchen
from app.models.user import User
from app.services.menu_service import MenuService
from app.schemas.menu import MenuItemCreate, MenuItemUpdate, MenuItemResponse, PaginatedMenuItemResponse

router = APIRouter()

@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED, summary="Create a new menu item")
async def create_menu_item(
    data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = MenuService(db)
    return await service.create_menu_item(data)

@router.get("/", response_model=PaginatedMenuItemResponse, summary="List menu items with search, filters, pagination, and sorting")
async def list_menu_items(
    restaurant_id: Optional[uuid.UUID] = Query(None, description="Filter by restaurant UUID"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by category UUID"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    is_veg: Optional[bool] = Query(None, description="Filter Vegetarian items"),
    is_non_veg: Optional[bool] = Query(None, description="Filter Non-Vegetarian items"),
    is_available: Optional[bool] = Query(None, description="Filter by availability"),
    is_todays_special: Optional[bool] = Query(None, description="Filter Today's Special items"),
    is_featured: Optional[bool] = Query(None, description="Filter Featured/Recommended items"),
    min_price: Optional[float] = Query(None, ge=0.0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0.0, description="Maximum price filter"),
    sort_by: str = Query("display_order", description="Sort order: display_order, price_asc, price_desc, rating, newest"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.list_menu_items(
        restaurant_id=restaurant_id,
        category_id=category_id,
        search_query=search,
        is_veg=is_veg,
        is_non_veg=is_non_veg,
        is_available=is_available,
        is_todays_special=is_todays_special,
        is_featured=is_featured,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )

@router.get("/search", response_model=PaginatedMenuItemResponse, summary="Full text search for menu items")
async def search_menu_items(
    q: str = Query(..., min_length=1, description="Search query string"),
    restaurant_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.list_menu_items(
        restaurant_id=restaurant_id,
        search_query=q,
        page=page,
        limit=limit,
    )

@router.get("/{item_id}", response_model=MenuItemResponse, summary="Get single menu item details")
async def get_menu_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.get_menu_item(item_id)

@router.put("/{item_id}", response_model=MenuItemResponse, summary="Update menu item details")
async def update_menu_item(
    item_id: uuid.UUID,
    data: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = MenuService(db)
    return await service.update_menu_item(item_id, data)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete (deactivate) a menu item")
async def delete_menu_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = MenuService(db)
    await service.delete_menu_item(item_id)
    return None
