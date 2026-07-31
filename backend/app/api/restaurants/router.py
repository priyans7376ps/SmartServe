from typing import List
import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_admin, get_current_kitchen
from app.models.user import User
from app.services.restaurant_service import RestaurantService
from app.schemas.restaurant import (
    RestaurantCreate, RestaurantUpdate, RestaurantSettingsUpdate, RestaurantStatusUpdate, RestaurantResponse
)

router = APIRouter()

@router.post("/", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED, summary="Create a new restaurant")
async def create_restaurant(
    data: RestaurantCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = RestaurantService(db)
    return await service.create_restaurant(data)

@router.get("/", response_model=List[RestaurantResponse], summary="List active restaurants")
async def list_restaurants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = RestaurantService(db)
    return await service.list_restaurants(skip=skip, limit=limit)

@router.get("/{restaurant_id}", response_model=RestaurantResponse, summary="Get single restaurant details")
async def get_restaurant(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = RestaurantService(db)
    return await service.get_restaurant(restaurant_id)

@router.put("/{restaurant_id}", response_model=RestaurantResponse, summary="Update restaurant details")
async def update_restaurant(
    restaurant_id: uuid.UUID,
    data: RestaurantUpdate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = RestaurantService(db)
    return await service.update_restaurant(restaurant_id, data)

@router.patch("/{restaurant_id}/settings", response_model=RestaurantResponse, summary="Update restaurant settings")
async def update_restaurant_settings(
    restaurant_id: uuid.UUID,
    data: RestaurantSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = RestaurantService(db)
    return await service.update_settings(restaurant_id, data)

@router.patch("/{restaurant_id}/status", response_model=RestaurantResponse, summary="Update restaurant operating status")
async def update_restaurant_status(
    restaurant_id: uuid.UUID,
    data: RestaurantStatusUpdate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = RestaurantService(db)
    return await service.update_status(restaurant_id, data)

@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete (deactivate) restaurant")
async def delete_restaurant(
    restaurant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = RestaurantService(db)
    await service.delete_restaurant(restaurant_id)
    return None
