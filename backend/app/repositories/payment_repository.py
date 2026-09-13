from typing import Optional, List, Tuple
from datetime import datetime
import uuid
from sqlalchemy import select, func, desc, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Payment, db)

    async def get_by_order_id(self, order_id: uuid.UUID) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.order_id == order_id)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_by_provider_order_id(self, provider_order_id: str) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.provider_order_id == provider_order_id)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_by_provider_payment_id(self, provider_payment_id: str) -> Optional[Payment]:
        stmt = select(Payment).where(
            or_(
                Payment.provider_payment_id == provider_payment_id,
                Payment.transaction_id == provider_payment_id
            )
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def search_payments(
        self,
        query: Optional[str] = None,
        status: Optional[str] = None,
        method: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Payment], int]:
        from app.models.order import Order
        from sqlalchemy.orm import selectinload

        stmt = select(Payment).outerjoin(Order, Payment.order_id == Order.id).options(selectinload(Payment.order))

        if status and status != "all":
            # Support both PaymentStatus enum string and normalized aliases
            norm_status = status.lower()
            if norm_status in ["paid", "completed"]:
                stmt = stmt.where(or_(Payment.payment_status == PaymentStatus.COMPLETED, Payment.payment_status == "paid"))
            else:
                try:
                    st_enum = PaymentStatus(norm_status)
                    stmt = stmt.where(Payment.payment_status == st_enum)
                except Exception:
                    stmt = stmt.where(Payment.payment_status == status)

        if method and method != "all":
            norm_method = method.lower()
            if norm_method in ["razorpay", "online"]:
                stmt = stmt.where(or_(Payment.payment_method == PaymentMethod.ONLINE, Payment.payment_method == "razorpay"))
            else:
                try:
                    m_enum = PaymentMethod(norm_method)
                    stmt = stmt.where(Payment.payment_method == m_enum)
                except Exception:
                    stmt = stmt.where(Payment.payment_method == method)

        if start_date:
            stmt = stmt.where(Payment.created_at >= start_date)
        if end_date:
            stmt = stmt.where(Payment.created_at <= end_date)

        if query:
            q = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Payment.transaction_id.ilike(q),
                    Payment.provider_order_id.ilike(q),
                    Payment.provider_payment_id.ilike(q),
                    Payment.billing_name.ilike(q),
                    Payment.billing_email.ilike(q),
                    Order.order_number.ilike(q),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(Payment.created_at)).offset(skip).limit(limit)
        res = await self.db.execute(stmt)
        items = list(res.scalars().all())
        return items, total
