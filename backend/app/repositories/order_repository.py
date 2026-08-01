from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order, OrderStatus, OrderType
from app.models.order_item import OrderItem
from app.models.order_status_log import OrderStatusLog
from app.repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: AsyncSession):
        super().__init__(Order, db)

    async def generate_order_number(self) -> str:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        short_id = str(uuid.uuid4())[:6].upper()
        return f"ORD-{timestamp}-{short_id}"

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        stmt = select(Order).where(Order.order_number == order_number)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_customer_orders(
        self,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
        customer_phone: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Order]:
        conditions = []
        if user_id:
            conditions.append(Order.user_id == user_id)
        elif customer_phone:
            conditions.append(Order.customer_phone == customer_phone)

        if not conditions:
            return []

        stmt = select(Order).where(or_(*conditions))
        if status:
            stmt = stmt.where(Order.status == status)
        stmt = stmt.order_by(desc(Order.placed_at)).offset(skip).limit(limit)

        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def create_order_with_items(
        self,
        order_data: Dict[str, Any],
        items_data: List[Dict[str, Any]]
    ) -> Order:
        if "order_number" not in order_data or not order_data["order_number"]:
            order_data["order_number"] = await self.generate_order_number()
        if "id" not in order_data:
            order_data["id"] = uuid.uuid4()

        order = Order(**order_data)
        self.db.add(order)

        for item in items_data:
            if "id" not in item:
                item["id"] = uuid.uuid4()
            item["order_id"] = order.id
            order_item = OrderItem(**item)
            self.db.add(order_item)

        # Status Log
        log = OrderStatusLog(
            id=uuid.uuid4(),
            order_id=order.id,
            previous_status=None,
            new_status=order.status,
            changed_by="customer",
            notes="Order placed by customer"
        )
        self.db.add(log)

        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def update_status(self, order_id: uuid.UUID, new_status: OrderStatus, changed_by: str = "system", notes: Optional[str] = None) -> Optional[Order]:
        order = await self.get_by_id(order_id)
        if not order:
            return None

        old_status = order.status
        order.status = new_status
        now = datetime.now(timezone.utc)

        if new_status == OrderStatus.CONFIRMED:
            order.confirmed_at = now
        elif new_status == OrderStatus.PREPARING:
            order.preparing_at = now
        elif new_status == OrderStatus.READY:
            order.ready_at = now
        elif new_status == OrderStatus.DELIVERED or new_status == OrderStatus.COMPLETED:
            order.delivered_at = now
            order.completed_at = now
        elif new_status == OrderStatus.CANCELLED:
            order.cancelled_at = now

        log = OrderStatusLog(
            id=uuid.uuid4(),
            order_id=order.id,
            previous_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes
        )
        self.db.add(log)
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order
