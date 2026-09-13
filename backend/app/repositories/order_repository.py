from typing import Optional, List, Dict, Any, Tuple
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload
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
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.menu_item),
                selectinload(Order.table),
                selectinload(Order.restaurant),
                selectinload(Order.status_logs),
                selectinload(Order.coupon),
            )
            .where(Order.order_number == order_number)
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def search_orders(
        self,
        query: Optional[str] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        payment_method: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        order_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Order], int]:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.menu_item),
                selectinload(Order.table),
                selectinload(Order.user),
            )
        )

        if status and status != "all":
            try:
                st_enum = OrderStatus(status)
                stmt = stmt.where(Order.status == st_enum)
            except Exception:
                stmt = stmt.where(Order.status == status)

        if payment_status and payment_status != "all":
            stmt = stmt.where(Order.payment_status == payment_status)

        if payment_method and payment_method != "all":
            stmt = stmt.where(Order.payment_method == payment_method)

        if order_type and order_type != "all":
            try:
                ot_enum = OrderType(order_type)
                stmt = stmt.where(Order.order_type == ot_enum)
            except Exception:
                stmt = stmt.where(Order.order_type == order_type)

        if date_from:
            stmt = stmt.where(Order.placed_at >= date_from)
        if date_to:
            stmt = stmt.where(Order.placed_at <= date_to)

        if query:
            q = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Order.order_number.ilike(q),
                    Order.customer_name.ilike(q),
                    Order.customer_phone.ilike(q),
                    Order.customer_email.ilike(q),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(Order.placed_at)).offset(skip).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all()), total

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

    async def get_by_id(self, id: Any) -> Optional[Order]:
        if isinstance(id, str):
            try:
                id = uuid.UUID(id)
            except ValueError:
                pass
        from sqlalchemy.orm import selectinload
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.menu_item),
                selectinload(Order.table),
                selectinload(Order.restaurant),
                selectinload(Order.status_logs),
                selectinload(Order.coupon),
            )
            .where(Order.id == id)
        )
        res = await self.db.execute(stmt)
        order = res.scalars().first()
        if order:
            try:
                await self.db.refresh(order, attribute_names=["items"])
            except Exception:
                pass
        return order

    async def create_order_with_items(
        self,
        order_data: Dict[str, Any],
        items_data: List[Dict[str, Any]]
    ) -> Order:
        try:
            if "order_number" not in order_data or not order_data["order_number"]:
                order_data["order_number"] = await self.generate_order_number()
            if "id" not in order_data:
                order_data["id"] = uuid.uuid4()
            if "status" not in order_data or not order_data["status"]:
                order_data["status"] = OrderStatus.PENDING

            order = Order(**order_data)
            self.db.add(order)

            for item in items_data:
                item_dict = dict(item)
                # Defensively strip computed/read-only properties
                item_dict.pop("total_price", None)
                if "status" in item_dict and "preparation_status" not in item_dict:
                    item_dict["preparation_status"] = item_dict.pop("status")
                elif "status" in item_dict:
                    item_dict.pop("status")

                if "unit_price" not in item_dict and "price" in item_dict:
                    item_dict["unit_price"] = item_dict.pop("price")
                else:
                    item_dict.pop("price", None)

                if "id" not in item_dict:
                    item_dict["id"] = uuid.uuid4()
                item_dict["order_id"] = order.id

                # Calculate subtotal if missing: (unit_price + add_ons_total) * quantity
                if "subtotal" not in item_dict or item_dict["subtotal"] is None:
                    u_price = float(item_dict.get("unit_price", 0.0))
                    a_total = float(item_dict.get("add_ons_total", 0.0))
                    qty = int(item_dict.get("quantity", 1))
                    item_dict["subtotal"] = round((u_price + a_total) * max(1, qty), 2)

                valid_keys = {
                    "id", "order_id", "menu_item_id", "item_name", "item_description",
                    "quantity", "unit_price", "compare_price", "subtotal", "notes",
                    "variant_selected", "add_ons_selected", "add_ons_total",
                    "preparation_status", "preparation_started_at", "preparation_completed_at",
                    "preparation_notes", "assigned_to", "created_at", "updated_at"
                }
                filtered_item_dict = {k: v for k, v in item_dict.items() if k in valid_keys}

                order_item = OrderItem(**filtered_item_dict)
                self.db.add(order_item)

            # Status Log
            log = OrderStatusLog(
                id=uuid.uuid4(),
                order_id=order.id,
                status=order.status,
                notes="Order placed by customer"
            )
            self.db.add(log)

            await self.db.commit()
            full_order = await self.get_by_id(order.id)
            return full_order or order
        except Exception:
            await self.db.rollback()
            raise

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
            status=new_status,
            notes=notes or f"Status changed by {changed_by}"
        )
        self.db.add(log)
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order
