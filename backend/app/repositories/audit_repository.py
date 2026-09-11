from typing import List, Optional, Tuple
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def log_action(
        self,
        admin_id: Optional[uuid.UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None
    ) -> AuditLog:
        return await self.create({
            "admin_id": admin_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id) if resource_id else None,
            "ip_address": ip_address,
            "details": details or {},
        })

    async def search_logs(
        self,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        admin_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[AuditLog], int]:
        stmt = select(AuditLog)
        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
        if resource_type:
            stmt = stmt.where(AuditLog.resource_type == resource_type)
        if admin_id:
            stmt = stmt.where(AuditLog.admin_id == admin_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
        res = await self.db.execute(stmt)
        items = list(res.scalars().all())
        return items, total
