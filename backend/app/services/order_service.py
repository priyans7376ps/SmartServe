from typing import Optional, List, Dict, Any
import logging
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.order_repository import OrderRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.coupon_repository import CouponRepository
from app.repositories.restaurant_repository import RestaurantRepository
from app.models.order import Order, OrderStatus, OrderType
from app.schemas.customer import (
    CheckoutSummaryResponse,
    OrderCreateRequest,
    OrderTrackingResponse,
)

logger = logging.getLogger(__name__)


def _calc_item_subtotal(unit_price: float, add_ons_total: float, quantity: int) -> float:
    """Canonical item subtotal: (unit_price + add_ons_total) * quantity, rounded to 2 dp."""
    return round((unit_price + add_ons_total) * max(1, quantity), 2)


def _build_order_totals(item_subtotals: List[float], discount_amount: float) -> dict:
    """Compute canonical order-level totals from a list of per-item subtotals."""
    order_subtotal = round(sum(item_subtotals), 2)
    tax_amount = round(order_subtotal * 0.05, 2)
    delivery_fee = 0.0  # dine-in / takeaway: always zero
    total_amount = max(0.0, round(order_subtotal + tax_amount + delivery_fee - discount_amount, 2))
    return {
        "subtotal": order_subtotal,
        "tax_amount": tax_amount,
        "delivery_fee": delivery_fee,
        "discount_amount": round(discount_amount, 2),
        "total_amount": total_amount,
    }

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.cart_repo = CartRepository(db)
        self.coupon_repo = CouponRepository(db)
        self.rest_repo = RestaurantRepository(db)

    async def get_checkout_summary(
        self,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None
    ) -> CheckoutSummaryResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        active_items = [it for it in cart.items if it.is_active]

        # Always compute from validated item data — never trust cart.subtotal which
        # is a computed @property that returns 0 if the ORM relationship is not loaded.
        item_subtotals = [
            _calc_item_subtotal(
                float(it.unit_price),
                float(it.add_ons_total or 0.0),
                int(it.quantity)
            )
            for it in active_items
        ]

        if not item_subtotals:
            return CheckoutSummaryResponse(
                subtotal=0.0,
                tax_amount=0.0,
                delivery_fee=0.0,
                discount_amount=0.0,
                total_amount=0.0,
                items_count=0,
                coupon_applied=None,
                estimated_prep_time_mins=15
            )

        totals = _build_order_totals(item_subtotals, cart.discount_amount or 0.0)

        return CheckoutSummaryResponse(
            subtotal=totals["subtotal"],
            tax_amount=totals["tax_amount"],
            delivery_fee=totals["delivery_fee"],
            discount_amount=totals["discount_amount"],
            total_amount=totals["total_amount"],
            items_count=sum(int(it.quantity) for it in active_items),
            coupon_applied=cart.coupon_code,
            estimated_prep_time_mins=20
        )

    async def place_order(
        self,
        request: OrderCreateRequest,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None
    ) -> Order:
        # 1. Load cart with fully populated items
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        if not cart:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart not found")

        active_items = [it for it in cart.items if it.is_active]
        if not active_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        logger.debug("place_order: cart_id=%s active_items=%d", cart.id, len(active_items))

        # 2. Validate menu items are still active and available
        for it in active_items:
            if not it.menu_item or not it.menu_item.is_active:
                name = it.menu_item.name if it.menu_item else "Selected item"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Menu item is no longer available: " + name
                )
            if not it.menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Menu item is currently sold out: " + it.menu_item.name
                )

        # 3. Get active restaurant
        restaurants = await self.rest_repo.get_all(limit=1)
        if not restaurants:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No active restaurant found"
            )
        restaurant_id = restaurants[0].id

        # 4. Build per-item dicts and compute totals from items.
        #    cart.subtotal is a computed @property — it can return 0 if the ORM
        #    relationship was not eagerly loaded.  We always compute from items.
        #    total_price is intentionally EXCLUDED — it is a read-only @property
        #    on OrderItem and must never be passed to OrderItem(**kwargs).
        items_data: List[Dict[str, Any]] = []
        item_subtotals: List[float] = []

        for it in active_items:
            unit_p = float(it.unit_price) if (it.unit_price is not None and float(it.unit_price) > 0) else (
                float(it.menu_item.price) if (it.menu_item and it.menu_item.price) else 0.0
            )
            addons_p = float(it.add_ons_total or 0.0)
            qty = max(1, int(it.quantity))
            item_sub = _calc_item_subtotal(unit_p, addons_p, qty)
            item_subtotals.append(item_sub)

            logger.debug(
                "  item=%r qty=%d unit_price=%.2f addons=%.2f subtotal=%.2f",
                it.menu_item.name, qty, unit_p, addons_p, item_sub,
            )

            items_data.append({
                "menu_item_id": it.menu_item_id,
                "item_name": it.menu_item.name,
                "item_description": it.menu_item.description,
                "unit_price": unit_p,
                "compare_price": float(it.compare_price) if it.compare_price is not None else None,
                "quantity": qty,
                "subtotal": item_sub,
                "notes": it.notes,
                "variant_selected": it.variant_selected,
                "add_ons_selected": it.add_ons_selected or [],
                "add_ons_total": addons_p,
                "preparation_status": "pending",
                # 'total_price' deliberately omitted: it is a read-only @property
            })

        discount_amount = cart.discount_amount or 0.0
        totals = _build_order_totals(item_subtotals, discount_amount)

        logger.debug(
            "place_order totals: subtotal=%.2f tax=%.2f discount=%.2f total=%.2f",
            totals["subtotal"], totals["tax_amount"],
            totals["discount_amount"], totals["total_amount"],
        )

        # 5. Build order record
        pay_method = "cash" if (request.payment_method in ["cash", "pay_at_table", None]) else request.payment_method
        order_data = {
            "restaurant_id": restaurant_id,
            "user_id": user_id,
            "table_id": request.table_id or cart.table_id,
            "order_type": OrderType.DINE_IN if request.order_type == "dine_in" else OrderType.TAKEAWAY,
            "status": OrderStatus.PENDING,
            "customer_name": request.customer_name or "Guest Customer",
            "customer_phone": request.customer_phone,
            "customer_email": request.customer_email,
            "subtotal": totals["subtotal"],
            "tax_amount": totals["tax_amount"],
            "delivery_fee": totals["delivery_fee"],
            "discount_amount": totals["discount_amount"],
            "total_amount": totals["total_amount"],
            "payment_status": "pending",
            "payment_method": pay_method,
            "coupon_id": cart.coupon_id,
            "coupon_code": cart.coupon_code,
            "notes": request.notes,
            "special_instructions": request.special_instructions,
            "estimated_preparation_time": 20,
            "placed_at": datetime.now(timezone.utc),
        }

        # 6. Persist order + items atomically
        order = await self.order_repo.create_order_with_items(order_data, items_data)

        # 6b. Create Payment record for cash orders
        if pay_method == "cash":
            from app.models.payment import Payment, PaymentMethod, PaymentStatus
            cash_payment = Payment(
                id=uuid.uuid4(),
                order_id=order.id,
                user_id=user_id,
                provider="cash",
                payment_method=PaymentMethod.CASH,
                payment_status=PaymentStatus.PENDING,
                amount=totals["total_amount"],
                total_amount=totals["total_amount"],
                currency="INR",
                tax_amount=totals["tax_amount"],
                discount_amount=totals["discount_amount"],
                billing_name=order.customer_name or "Guest Diner",
                billing_phone=order.customer_phone,
                billing_email=order.customer_email,
            )
            self.db.add(cash_payment)
            await self.db.commit()

        # 7. Mark cart as converted
        await self.cart_repo.clear_cart(cart.id)
        refreshed_cart = await self.cart_repo.get_by_id(cart.id)
        if refreshed_cart:
            refreshed_cart.is_converted = True
            refreshed_cart.converted_at = datetime.now(timezone.utc)
            self.db.add(refreshed_cart)
            await self.db.commit()

        # 8. Record coupon usage (only for authenticated users)
        if cart.coupon_id and user_id:
            await self.coupon_repo.record_usage(
                coupon_id=cart.coupon_id,
                user_id=user_id,
                order_id=order.id,
                discount_amount=totals["discount_amount"],
                order_amount=totals["subtotal"],
            )

        # 9. Return fully-loaded order
        full_order = await self.order_repo.get_by_id(order.id)
        return full_order or order

    async def get_order_tracking(self, order_id: uuid.UUID) -> OrderTrackingResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        table_num = str(order.table.table_number) if order.table else "N/A"
        token_num = f"TKN-{order.order_number[-4:]}"

        timeline = {
            "pending": order.placed_at,
            "confirmed": order.confirmed_at,
            "preparing": order.preparing_at,
            "ready": order.ready_at,
            "completed": order.completed_at or order.delivered_at,
            "cancelled": order.cancelled_at
        }

        return OrderTrackingResponse(
            order_id=order.id,
            order_number=order.order_number,
            status=order.status.value,
            payment_status=order.payment_status,
            table_number=table_num,
            token_number=token_num,
            estimated_time_mins=order.estimated_preparation_time or 20,
            placed_at=order.placed_at,
            timeline=timeline
        )

    async def cancel_order(self, order_id: uuid.UUID, reason: Optional[str] = None) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if order.status in [OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order cannot be cancelled at status '{order.status.value}'"
            )

        return await self.order_repo.update_status(
            order_id=order_id,
            new_status=OrderStatus.CANCELLED,
            changed_by="customer",
            notes=reason or "Cancelled by customer"
        )

    async def repeat_order(self, order_id: uuid.UUID, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None) -> Order:
        original_order = await self.order_repo.get_by_id(order_id)
        if not original_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original order not found")

        # Clear cart and copy items
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        await self.cart_repo.clear_cart(cart.id)

        for item in original_order.items:
            await self.cart_repo.add_item_to_cart(
                cart_id=cart.id,
                menu_item_id=item.menu_item_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                notes=item.notes,
                variant_selected=item.variant_selected,
                add_ons_selected=item.add_ons_selected,
                add_ons_total=item.add_ons_total or 0.0
            )

        # Place new order
        request = OrderCreateRequest(
            table_id=original_order.table_id,
            order_type=original_order.order_type.value,
            customer_name=original_order.customer_name,
            customer_phone=original_order.customer_phone,
            customer_email=original_order.customer_email,
            payment_method=original_order.payment_method or "cash"
        )
        return await self.place_order(request=request, user_id=user_id, session_id=session_id)
