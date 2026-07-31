from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.table_repository import TableRepository
from app.repositories.restaurant_repository import RestaurantRepository
from app.schemas.table import TableCreate, TableUpdate, TableStatusUpdate, TableResponse
from app.models.table import Table

class TableService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TableRepository(db)
        self.restaurant_repo = RestaurantRepository(db)

    async def create_table(self, data: TableCreate) -> TableResponse:
        restaurant = await self.restaurant_repo.get_by_id(data.restaurant_id)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurant not found."
            )

        existing = await self.repo.get_by_table_number(data.restaurant_id, data.table_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table number {data.table_number} already exists in this restaurant."
            )

        table_dict = data.model_dump()
        table_dict["qr_code_data"] = f"smartserve://restaurant/{data.restaurant_id}/table/{data.table_number}"
        table_dict["qr_code_url"] = f"/api/v1/tables/qr/{data.restaurant_id}/{data.table_number}"
        table_dict.setdefault("is_occupied", False)
        table_dict.setdefault("is_active", True)
        table_dict.setdefault("is_reserved", False)

        table = await self.repo.create(table_dict)
        return TableResponse.model_validate(table)

    async def get_table(self, table_id: uuid.UUID) -> TableResponse:
        table = await self.repo.get_by_id(table_id)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found."
            )
        return TableResponse.model_validate(table)

    async def list_tables(self, restaurant_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[TableResponse]:
        tables = await self.repo.get_by_restaurant(restaurant_id, skip=skip, limit=limit)
        return [TableResponse.model_validate(t) for t in tables]

    async def update_table(self, table_id: uuid.UUID, data: TableUpdate) -> TableResponse:
        table = await self.repo.get_by_id(table_id)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found."
            )

        update_dict = data.model_dump(exclude_unset=True)
        updated = await self.repo.update(table, update_dict)
        return TableResponse.model_validate(updated)

    async def update_status(self, table_id: uuid.UUID, data: TableStatusUpdate) -> TableResponse:
        table = await self.repo.get_by_id(table_id)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found."
            )

        valid_statuses = {"available", "occupied", "reserved", "inactive"}
        if data.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{data.status}'. Must be one of {valid_statuses}."
            )

        update_dict = {
            "status": data.status,
            "is_occupied": (data.status == "occupied"),
            "is_reserved": (data.status == "reserved"),
            "is_active": (data.status != "inactive")
        }
        updated = await self.repo.update(table, update_dict)
        return TableResponse.model_validate(updated)

    async def delete_table(self, table_id: uuid.UUID) -> bool:
        table = await self.repo.get_by_id(table_id)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found."
            )
        await self.repo.update(table, {"is_active": False, "status": "inactive"})
        return True
