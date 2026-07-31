from typing import List
import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_kitchen
from app.models.user import User
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryReorderRequest, CategoryResponse

router = APIRouter()

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Create a food category")
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = CategoryService(db)
    return await service.create_category(data)

@router.get("/", response_model=List[CategoryResponse], summary="List categories for a restaurant")
async def list_categories(
    restaurant_id: uuid.UUID = Query(..., description="Restaurant UUID"),
    active_only: bool = Query(True, description="Filter active categories"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return await service.list_categories(restaurant_id, active_only=active_only, skip=skip, limit=limit)

@router.get("/{category_id}", response_model=CategoryResponse, summary="Get single category details")
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return await service.get_category(category_id)

@router.put("/{category_id}", response_model=CategoryResponse, summary="Update category details")
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = CategoryService(db)
    return await service.update_category(category_id, data)

@router.patch("/reorder", response_model=List[CategoryResponse], summary="Reorder category display order")
async def reorder_categories(
    data: CategoryReorderRequest,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = CategoryService(db)
    return await service.reorder_categories(data)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete (deactivate) a category")
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = CategoryService(db)
    await service.delete_category(category_id)
    return None
