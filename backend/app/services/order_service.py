from typing import Optional, List, Dict, Any
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
        subtotal = cart.subtotal
        if subtotal == 0:
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

        tax = round(subtotal * 0.05, 2)
        delivery_fee = 0.0
        discount = cart.discount_amount or 0.0
        total = max(0.0, subtotal + tax + delivery_fee - discount)

        return CheckoutSummaryResponse(
            subtotal=round(subtotal, 2),
            tax_amount=tax,
            delivery_fee=delivery_fee,
            discount_amount=round(discount, 2),
            total_amount=round(total, 2),
            items_count=cart.total_items,
            coupon_applied=cart.coupon_code,
            estimated_prep_time_mins=20
        )

    async def place_order(
        self,
        request: OrderCreateRequest,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None
    ) -> Order:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        if not cart.items or cart.subtotal == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        # Get default active restaurant
        restaurants = await self.rest_repo.get_all(limit=1)
        if not restaurants:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No active restaurant found")
        restaurant_id = restaurants[0].id

        subtotal = cart.subtotal
        tax_amount = round(subtotal * 0.05, 2)
        discount_amount = cart.discount_amount or 0.0
        total_amount = max(0.0, subtotal + tax_amount - discount_amount)

        order_data = {
            "restaurant_id": restaurant_id,
            "user_id": user_id,
            "table_id": request.table_id or cart.table_id,
            "order_type": OrderType.DINE_IN if request.order_type == "dine_in" else OrderType.TAKEAWAY,
            "status": OrderStatus.PENDING,
            "customer_name": request.customer_name or "Guest Customer",
            "customer_phone": request.customer_phone,
            "customer_email": request.customer_email,
            "subtotal": round(subtotal, 2),
            "tax_amount": tax_amount,
            "discount_amount": round(discount_amount, 2),
            "total_amount": round(total_amount, 2),
            "payment_status": "pending" if request.payment_method != "cash" else "paid_cash",
            "payment_method": request.payment_method,
            "coupon_id": cart.coupon_id,
            "coupon_code": cart.coupon_code,
            "notes": request.notes,
            "special_instructions": request.special_instructions,
            "estimated_preparation_time": 20,
            "placed_at": datetime.now(timezone.utc),
        }

        items_data = []
        for it in cart.items:
            if it.is_active and it.menu_item:
                items_data.append({
                    "menu_item_id": it.menu_item_id,
                    "item_name": it.menu_item.name,
                    "unit_price": it.unit_price,
                    "quantity": it.quantity,
                    "total_price": it.subtotal,
                    "notes": it.notes,
                    "variant_selected": it.variant_selected,
                    "add_ons_selected": it.add_ons_selected,
                    "status": "pending"
                })

        order = await self.order_repo.create_order_with_items(order_data, items_data)

        # Clear cart after conversion
        await self.cart_repo.clear_cart(cart.id)
        cart.is_converted = True
        cart.converted_at = datetime.now(timezone.utc)
        self.db.add(cart)
        await self.db.commit()

        # If coupon used, record usage
        if cart.coupon_id and user_id:
            await self.coupon_repo.record_usage(
                coupon_id=cart.coupon_id,
                user_id=user_id,
                order_id=order.id,
                discount_amount=discount_amount,
                order_amount=subtotal
            )

        return order

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
                add_ons_selected=item.add_ons_selected
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
