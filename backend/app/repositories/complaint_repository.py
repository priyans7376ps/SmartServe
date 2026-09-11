from typing import Optional, List, Tuple
from datetime import datetime
import uuid
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint, ComplaintStatus, ComplaintPriority
from app.repositories.base import BaseRepository


class ComplaintRepository(BaseRepository[Complaint]):
    def __init__(self, db: AsyncSession):
        super().__init__(Complaint, db)

    async def search_complaints(
        self,
        query: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Complaint], int]:
        stmt = select(Complaint)

        if status:
            stmt = stmt.where(Complaint.status == status)
        if priority:
            stmt = stmt.where(Complaint.priority == priority)
        if category:
            stmt = stmt.where(Complaint.category == category)
        if user_id:
            stmt = stmt.where(Complaint.user_id == user_id)

        if query:
            q = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Complaint.subject.ilike(q),
                    Complaint.description.ilike(q),
                    Complaint.contact_email.ilike(q),
                    Complaint.contact_phone.ilike(q)
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(Complaint.created_at)).offset(skip).limit(limit)
        res = await self.db.execute(stmt)
        items = list(res.scalars().all())
        return items, total
