from typing import List
import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_kitchen
from app.models.user import User
from app.services.table_service import TableService
from app.schemas.table import TableCreate, TableUpdate, TableStatusUpdate, TableResponse

router = APIRouter()

@router.post("/", response_model=TableResponse, status_code=status.HTTP_201_CREATED, summary="Create a new table")
async def create_table(
    data: TableCreate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = TableService(db)
    return await service.create_table(data)

@router.get("/", response_model=List[TableResponse], summary="Get all tables for a restaurant")
async def list_tables(
    restaurant_id: uuid.UUID = Query(..., description="Restaurant UUID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = TableService(db)
    return await service.list_tables(restaurant_id, skip=skip, limit=limit)

@router.get("/{table_id}", response_model=TableResponse, summary="Get single table details")
async def get_table(
    table_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = TableService(db)
    return await service.get_table(table_id)

@router.put("/{table_id}", response_model=TableResponse, summary="Update table details")
async def update_table(
    table_id: uuid.UUID,
    data: TableUpdate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = TableService(db)
    return await service.update_table(table_id, data)

@router.patch("/{table_id}/status", response_model=TableResponse, summary="Update table status (available, occupied, reserved, inactive)")
async def update_table_status(
    table_id: uuid.UUID,
    data: TableStatusUpdate,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = TableService(db)
    return await service.update_status(table_id, data)

@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete (deactivate) a table")
async def delete_table(
    table_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    staff: User = Depends(get_current_kitchen)
):
    service = TableService(db)
    await service.delete_table(table_id)
    return None
