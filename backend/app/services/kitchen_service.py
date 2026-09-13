from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.order_status_log import OrderStatusLog
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.menu_repository import MenuRepository
from app.repositories.category_repository import CategoryRepository

# Allowed status transitions matrix
VALID_TRANSITIONS = {
    OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    OrderStatus.DELIVERED: [OrderStatus.COMPLETED],
    OrderStatus.COMPLETED: [],
    OrderStatus.CANCELLED: [],
}

class KitchenService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.menu_repo = MenuRepository(db)
        self.category_repo = CategoryRepository(db)

    async def get_dashboard_stats(self, restaurant_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        stmt = select(Order).where(Order.placed_at >= today_start)
        if restaurant_id:
            stmt = stmt.where(Order.restaurant_id == restaurant_id)

        res = await self.db.execute(stmt)
        today_orders = list(res.scalars().all())

        counts = {
            "total_today": len(today_orders),
            "pending": 0,
            "accepted": 0,
            "preparing": 0,
            "ready": 0,
            "completed": 0,
            "cancelled": 0,
        }

        cooking_times = []
        waiting_times = []
        active_tables = set()

        for o in today_orders:
            st = o.status.value
            if st in counts:
                counts[st] += 1
            if st == "confirmed":
                counts["accepted"] += 1

            if o.status in [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]:
                if o.table_id:
                    active_tables.add(str(o.table_id))

            # Calculate waiting time in minutes
            placed = o.placed_at or now
            if placed.tzinfo is None and now.tzinfo is not None:
                placed = placed.replace(tzinfo=timezone.utc)
            elif placed.tzinfo is not None and now.tzinfo is None:
                placed = placed.replace(tzinfo=None)
            wait_mins = (now - placed).total_seconds() / 60.0
            if o.status not in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
                waiting_times.append(wait_mins)

            # Calculate cooking time if completed
            if o.preparing_at and o.ready_at:
                p_at = o.preparing_at
                r_at = o.ready_at
                if p_at.tzinfo is None and r_at.tzinfo is not None:
                    p_at = p_at.replace(tzinfo=timezone.utc)
                elif p_at.tzinfo is not None and r_at.tzinfo is None:
                    r_at = r_at.replace(tzinfo=timezone.utc)
                cook_mins = (r_at - p_at).total_seconds() / 60.0
                cooking_times.append(cook_mins)

        avg_cooking = round(sum(cooking_times) / len(cooking_times), 1) if cooking_times else 15.0
        avg_waiting = round(sum(waiting_times) / len(waiting_times), 1) if waiting_times else 8.0

        return {
            "today_orders": counts["total_today"],
            "pending_orders": counts["pending"],
            "accepted_orders": counts["accepted"],
            "preparing_orders": counts["preparing"],
            "ready_orders": counts["ready"],
            "completed_orders": counts["completed"],
            "cancelled_orders": counts["cancelled"],
            "average_cooking_time": avg_cooking,
            "average_waiting_time": avg_waiting,
            "active_tables": len(active_tables),
        }

    async def get_dashboard_performance(self, restaurant_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        stats = await self.get_dashboard_stats(restaurant_id)
        total = stats["today_orders"]
        completed = stats["completed_orders"]
        cancelled = stats["cancelled_orders"]

        completion_rate = round((completed / total * 100), 1) if total > 0 else 100.0
        rejection_rate = round((cancelled / total * 100), 1) if total > 0 else 0.0

        return {
            "completion_rate": completion_rate,
            "rejection_rate": rejection_rate,
            "completed_count": completed,
            "cancelled_count": cancelled,
            "average_preparation_time": stats["average_cooking_time"],
            "performance_rating": "Optimal" if completion_rate >= 90 else "Standard",
        }

    def format_single_order(self, o: Order, now: Optional[datetime] = None) -> Dict[str, Any]:
        if now is None:
            now = datetime.now(timezone.utc)
        placed = o.placed_at
        if placed and placed.tzinfo is None and now.tzinfo is not None:
            placed = placed.replace(tzinfo=timezone.utc)
        elif placed and placed.tzinfo is not None and now.tzinfo is None:
            placed = placed.replace(tzinfo=None)
        wait_mins = int((now - placed).total_seconds() // 60) if placed else 0
        if wait_mins >= 20:
            priority = "high"
        elif wait_mins >= 10:
            priority = "medium"
        else:
            priority = "low"

        table_num = str(o.table.table_number) if (o.table and o.table.table_number is not None) else "N/A"
        token_num = f"TKN-{o.order_number[-4:]}" if o.order_number else "TKN-0000"

        # Normalized separate payment_status and payment_method
        raw_pay_status = str(o.payment_status or "pending").lower().strip()
        if raw_pay_status in ["completed", "paid", "successful", "success"]:
            pay_status = "paid"
        elif raw_pay_status in ["failed", "failure"]:
            pay_status = "failed"
        elif raw_pay_status in ["refunded"]:
            pay_status = "refunded"
        elif raw_pay_status in ["partially_refunded"]:
            pay_status = "partially_refunded"
        else:
            pay_status = "pending"

        raw_pay_method = str(o.payment_method or "cash").lower().strip()
        if raw_pay_method in ["online", "razorpay"]:
            pay_method = "razorpay"
        elif raw_pay_method in ["cash", "pay_at_table", "table"]:
            pay_method = "cash"
        elif raw_pay_method in ["upi"]:
            pay_method = "upi"
        elif raw_pay_method in ["card"]:
            pay_method = "card"
        else:
            pay_method = raw_pay_method

        items_list = []
        for item in (o.items or []):
            item_price = float(item.unit_price) if item.unit_price is not None else 0.0
            item_sub = float(item.subtotal) if item.subtotal is not None else round(item_price * item.quantity, 2)
            menu_it = getattr(item, "menu_item", None)
            items_list.append({
                "id": str(item.id),
                "name": item.item_name,
                "price": item_price,
                "unit_price": item_price,
                "subtotal": item_sub,
                "total_price": item.total_price,
                "quantity": item.quantity,
                "notes": item.notes,
                "variant": item.variant_selected,
                "add_ons": item.add_ons_selected,
                "status": item.preparation_status or getattr(item, "status", "pending"),
                "is_veg": getattr(menu_it, "is_veg", True) if menu_it else True,
                "image_url": getattr(menu_it, "image_url", None) if menu_it else None,
            })

        return {
            "id": str(o.id),
            "order_number": o.order_number,
            "token_number": token_num,
            "table_number": table_num,
            "customer_name": o.customer_name or "Guest Diner",
            "customer_type": "registered" if o.user_id else "guest",
            "status": o.status.value,
            "payment_status": pay_status,
            "payment_method": pay_method,
            "placed_at": o.placed_at,
            "estimated_time_mins": o.estimated_preparation_time or 20,
            "waiting_time_mins": wait_mins,
            "priority": priority,
            "notes": o.notes,
            "special_instructions": o.special_instructions,
            "items": items_list,
            "subtotal": o.subtotal,
            "tax_amount": o.tax_amount,
            "discount_amount": o.discount_amount,
            "total_amount": o.total_amount,
        }

    async def get_order_details(self, order_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            return None
        return self.format_single_order(order)

    async def get_active_queue(
        self,
        restaurant_id: Optional[uuid.UUID] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        priority_filter: Optional[str] = None,
        sort_by: str = "placed_at",
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        from sqlalchemy.orm import selectinload
        stmt = (
            select(Order)
            .options(
                selectinload(Order.table),
                selectinload(Order.items).selectinload(OrderItem.menu_item),
            )
        )

        if restaurant_id:
            stmt = stmt.where(Order.restaurant_id == restaurant_id)

        if status_filter:
            if status_filter == "active":
                stmt = stmt.where(Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]))
            elif status_filter in ["accepted", "confirmed"]:
                stmt = stmt.where(Order.status == OrderStatus.CONFIRMED)
            elif status_filter == "pending":
                stmt = stmt.where(Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED]))
            else:
                try:
                    target_st = OrderStatus(status_filter)
                    stmt = stmt.where(Order.status == target_st)
                except ValueError:
                    pass

        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Order.order_number.ilike(search_pattern),
                    Order.customer_name.ilike(search_pattern),
                    Order.customer_phone.ilike(search_pattern)
                )
            )

        if sort_by == "priority":
            stmt = stmt.order_by(Order.placed_at.asc())
        else:
            stmt = stmt.order_by(Order.placed_at.desc())

        res = await self.db.execute(stmt)
        all_orders = list(res.scalars().all())

        formatted_orders = []
        for o in all_orders:
            formatted = self.format_single_order(o, now)
            if priority_filter and formatted["priority"] != priority_filter.lower():
                continue
            formatted_orders.append(formatted)

        total_count = len(formatted_orders)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_items = formatted_orders[start:end]

        return {
            "orders": paginated_items,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total_count + page_size - 1) // page_size)
        }

    async def update_order_status(
        self,
        order_id: uuid.UUID,
        target_status: OrderStatus,
        changed_by_user: User,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        current_status = order.status

        # Validate workflow transition
        allowed = VALID_TRANSITIONS.get(current_status, [])
        if target_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current_status.value}' to '{target_status.value}'"
            )

        updated_order = await self.order_repo.update_status(
            order_id=order_id,
            new_status=target_status,
            changed_by=f"staff:{changed_by_user.full_name}",
            notes=notes or f"Status changed to {target_status.value} by kitchen staff"
        )

        return {
            "status": "success",
            "message": f"Order {updated_order.order_number} status updated to {target_status.value}",
            "order_id": str(updated_order.id),
            "new_status": updated_order.status.value,
        }
