import hmac
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
import uuid
import razorpay
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import logger
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.models.restaurant import Restaurant
from app.repositories.payment_repository import PaymentRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.audit_repository import AuditRepository


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.order_repo = OrderRepository(db)
        self.audit_repo = AuditRepository(db)
        self.razorpay_client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def verify_signature(
        self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
    ) -> bool:
        """
        Verify Razorpay HMAC-SHA256 signature server-side using RAZORPAY_KEY_SECRET.
        """
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False

        # 1. Direct HMAC-SHA256 verification using RAZORPAY_KEY_SECRET
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        generated = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg,
            hashlib.sha256
        ).hexdigest()
        if hmac.compare_digest(generated, razorpay_signature):
            return True

        # 2. Secondary SDK utility check
        try:
            self.razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            return True
        except Exception:
            return False

    def verify_webhook_signature(self, body_bytes: bytes, signature: str) -> bool:
        """
        Verify Razorpay Webhook signature server-side.
        """
        try:
            self.razorpay_client.utility.verify_webhook_signature(
                body_bytes.decode('utf-8'),
                signature,
                settings.RAZORPAY_WEBHOOK_SECRET
            )
            return True
        except Exception:
            generated = hmac.new(
                settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
                body_bytes,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated, signature)

    async def create_razorpay_order(
        self, order_id: uuid.UUID, user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Calculates authoritative amount server-side, validates order state,
        creates Razorpay Order, and saves Payment record.
        """
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        # Prevent duplicate payment on already-completed orders
        if order.payment_status in ["completed", "paid"] or order.status in [
            OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order has already been paid and confirmed."
            )

        # Check existing payment record - if already completed, prevent re-creation
        existing_payment = await self.payment_repo.get_by_order_id(order.id)
        if existing_payment and existing_payment.payment_status == PaymentStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment has already been completed for this order."
            )

        # Validate order total amount strictly server-side (never trust frontend input)
        authoritative_total = round(order.total_amount, 2)
        amount_in_paise = int(round(authoritative_total * 100))

        if amount_in_paise <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid order total amount for online payment."
            )

        # Create order in Razorpay Test Mode via SDK
        try:
            rzp_order = self.razorpay_client.order.create({
                "amount": amount_in_paise,
                "currency": settings.CURRENCY,
                "receipt": f"rcpt_{str(order.order_number)[:30]}",
                "notes": {
                    "smartserve_order_id": str(order.id),
                    "order_number": order.order_number,
                }
            })
            if not rzp_order or "id" not in rzp_order:
                raise ValueError("Missing 'id' in Razorpay API response")
            razorpay_order_id = rzp_order["id"]
        except Exception as e:
            logger.error(f"Razorpay order creation failed for order {order.order_number}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to create Razorpay payment order: {str(e)}"
            )

        # Update or create pending Payment record
        if existing_payment:
            payment = existing_payment
            payment.provider = "razorpay"
            payment.provider_order_id = razorpay_order_id
            payment.amount = authoritative_total
            payment.total_amount = authoritative_total
            payment.payment_status = PaymentStatus.PENDING
            self.db.add(payment)
            await self.db.commit()
            await self.db.refresh(payment)
        else:
            payment = await self.payment_repo.create({
                "order_id": order.id,
                "user_id": user.id if user else order.user_id,
                "provider": "razorpay",
                "provider_order_id": razorpay_order_id,
                "payment_method": PaymentMethod.ONLINE,
                "payment_status": PaymentStatus.PENDING,
                "amount": authoritative_total,
                "currency": settings.CURRENCY,
                "tax_amount": order.tax_amount,
                "service_charge": order.service_charge,
                "discount_amount": order.discount_amount,
                "total_amount": authoritative_total,
                "billing_name": order.customer_name or (user.full_name if user else "Guest Customer"),
                "billing_email": order.customer_email or (user.email if user else None),
                "billing_phone": order.customer_phone or (user.phone if user else None),
            })

        logger.info(
            f"Razorpay order {razorpay_order_id} created for SmartServe order {order.order_number} (Amount: ₹{authoritative_total})"
        )

        return {
            "razorpay_order_id": razorpay_order_id,
            "amount": amount_in_paise,
            "currency": settings.CURRENCY,
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "order_id": order.id,
            "payment_id": payment.id,
        }

    async def verify_payment(
        self,
        order_id: uuid.UUID,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        admin_user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Verify payment signature using RAZORPAY_KEY_SECRET,
        atomically update Payment and Order, and notify Kitchen.
        """
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        payment = await self.payment_repo.get_by_order_id(order_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record for order not found."
            )

        # Idempotency check: if already completed, return existing success state cleanly
        if payment.payment_status == PaymentStatus.COMPLETED:
            return {
                "success": True,
                "message": "Payment already confirmed.",
                "order_id": order_id,
                "payment_id": payment.id,
                "order_status": order.status.value,
                "payment_status": PaymentStatus.COMPLETED.value
            }

        # Validate that razorpay_order_id matches the expected provider_order_id
        if payment.provider_order_id and payment.provider_order_id != razorpay_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay order ID mismatch with payment record."
            )

        # Cryptographically verify signature server-side
        is_valid = self.verify_signature(
            razorpay_order_id, razorpay_payment_id, razorpay_signature
        )

        if not is_valid:
            payment.payment_status = PaymentStatus.FAILED
            payment.failure_reason = "Invalid Razorpay payment signature."
            payment.provider_payment_id = razorpay_payment_id
            payment.provider_signature = razorpay_signature
            self.db.add(payment)
            await self.db.commit()

            logger.warning(f"Payment signature verification FAILED for order {order_id}.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed due to invalid signature."
            )

        # Signature is valid -> Atomically confirm payment and order
        now = datetime.now(timezone.utc)
        payment.provider_payment_id = razorpay_payment_id
        payment.provider_signature = razorpay_signature
        payment.transaction_id = razorpay_payment_id
        payment.payment_status = PaymentStatus.COMPLETED
        payment.paid_at = now
        payment.verified_at = now
        self.db.add(payment)

        # Update order status to CONFIRMED and payment_status to paid
        order.status = OrderStatus.CONFIRMED
        order.payment_status = "paid"
        order.payment_method = "razorpay"
        order.confirmed_at = now
        self.db.add(order)

        await self.db.commit()
        await self.db.refresh(payment)
        await self.db.refresh(order)

        # Transmit order to Kitchen Display in real-time via WebSocket
        try:
            from app.core.websocket import manager, WSEventType, create_ws_message
            from app.services.kitchen_service import KitchenService
            kitchen_svc = KitchenService(self.db)
            formatted_order = kitchen_svc.format_single_order(order)
            kitchen_msg = create_ws_message(
                WSEventType.NEW_ORDER,
                {
                    "order": formatted_order,
                    "message": f"New confirmed table order #{order.order_number} received!"
                }
            )
            await manager.broadcast_to_role("kitchen", kitchen_msg)
            await manager.broadcast_to_room("kitchen", kitchen_msg)
        except Exception as ws_err:
            logger.warning(f"WebSocket kitchen broadcast deferred: {ws_err}")

        # Audit log (sanitized, no secrets)
        await self.audit_repo.log_action(
            admin_id=admin_user.id if admin_user else None,
            action="PAYMENT_VERIFIED",
            resource_type="payment",
            resource_id=str(payment.id),
            details={
                "order_id": str(order_id),
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "amount": payment.total_amount,
            }
        )

        logger.info(
            f"Payment verified successfully for order {order.order_number} (Payment ID: {razorpay_payment_id}, Amount: ₹{payment.total_amount})"
        )

        return {
            "success": True,
            "message": "Payment verified and order confirmed successfully.",
            "order_id": order_id,
            "payment_id": payment.id,
            "order_status": OrderStatus.CONFIRMED.value,
            "payment_status": PaymentStatus.COMPLETED.value
        }

    async def process_webhook(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Idempotently process Razorpay webhook event payload.
        """
        event = event_data.get("event", "")
        payload = event_data.get("payload", {})

        payment_entity = payload.get("payment", {}).get("entity", {})
        order_entity = payload.get("order", {}).get("entity", {})

        rzp_payment_id = payment_entity.get("id")
        rzp_order_id = payment_entity.get("order_id") or order_entity.get("id")

        if not rzp_order_id:
            return {"status": "ignored", "reason": "No order_id in webhook payload"}

        payment = await self.payment_repo.get_by_provider_order_id(rzp_order_id)
        if not payment:
            return {"status": "ignored", "reason": "Associated payment record not found"}

        now = datetime.now(timezone.utc)

        if event in ["payment.captured", "order.paid"]:
            if payment.payment_status != PaymentStatus.COMPLETED:
                payment.payment_status = PaymentStatus.COMPLETED
                payment.provider_payment_id = rzp_payment_id
                payment.transaction_id = rzp_payment_id
                payment.paid_at = now
                payment.verified_at = now
                self.db.add(payment)

                order = await self.order_repo.get_by_id(payment.order_id)
                if order:
                    order.status = OrderStatus.CONFIRMED
                    order.payment_status = "paid"
                    order.payment_method = "razorpay"
                    order.confirmed_at = now
                    self.db.add(order)

                await self.db.commit()

                if order:
                    try:
                        from app.core.websocket import manager, WSEventType, create_ws_message
                        from app.services.kitchen_service import KitchenService
                        kitchen_svc = KitchenService(self.db)
                        formatted_order = kitchen_svc.format_single_order(order)
                        kitchen_msg = create_ws_message(
                            WSEventType.NEW_ORDER,
                            {
                                "order": formatted_order,
                                "message": f"Webhook: New confirmed table order #{order.order_number} received!"
                            }
                        )
                        await manager.broadcast_to_role("kitchen", kitchen_msg)
                        await manager.broadcast_to_room("kitchen", kitchen_msg)
                    except Exception as ws_err:
                        logger.warning(f"WebSocket kitchen broadcast deferred in webhook: {ws_err}")

        elif event == "payment.failed":
            if payment.payment_status != PaymentStatus.COMPLETED:
                payment.payment_status = PaymentStatus.FAILED
                payment.failure_reason = payment_entity.get("error_description", "Payment failed")
                self.db.add(payment)
                order = await self.order_repo.get_by_id(payment.order_id)
                if order:
                    order.payment_status = "failed"
                    order.payment_method = "razorpay"
                    self.db.add(order)
                await self.db.commit()

        return {"status": "processed", "event": event}

    async def process_refund(
        self,
        payment_id: uuid.UUID,
        amount: Optional[float],
        reason: Optional[str],
        admin_user: User
    ) -> Payment:
        """
        Process admin refund.
        """
        payment = await self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found."
            )

        if payment.payment_status not in [PaymentStatus.COMPLETED, PaymentStatus.PARTIALLY_REFUNDED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot refund payment with status '{payment.payment_status.value}'."
            )

        refundable_max = payment.total_amount - payment.refund_amount
        refund_target = amount if amount is not None else refundable_max

        if refund_target <= 0 or refund_target > refundable_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Refund amount {refund_target} exceeds maximum refundable amount {refundable_max}."
            )

        # Attempt Razorpay SDK refund
        try:
            if payment.provider_payment_id:
                self.razorpay_client.payment.refund(
                    payment.provider_payment_id,
                    {
                        "amount": int(round(refund_target * 100)),
                        "notes": {"reason": reason or "Admin refund"}
                    }
                )
        except Exception as e:
            logger.warning(f"Razorpay refund call exception (proceeding with local DB refund record): {e}")

        now = datetime.now(timezone.utc)
        payment.refund_amount += refund_target
        payment.refund_reason = reason or "Admin initiated refund"
        payment.refunded_at = now

        if payment.refund_amount >= payment.total_amount:
            payment.payment_status = PaymentStatus.REFUNDED
        else:
            payment.payment_status = PaymentStatus.PARTIALLY_REFUNDED

        self.db.add(payment)

        # Update order status if fully refunded
        if payment.payment_status == PaymentStatus.REFUNDED:
            order = await self.order_repo.get_by_id(payment.order_id)
            if order:
                order.status = OrderStatus.REFUNDED
                order.payment_status = "refunded"
                self.db.add(order)

        await self.db.commit()
        await self.db.refresh(payment)

        # Audit log
        await self.audit_repo.log_action(
            admin_id=admin_user.id,
            action="PAYMENT_REFUNDED",
            resource_type="payment",
            resource_id=str(payment.id),
            details={
                "refund_amount": refund_target,
                "refund_status": payment.payment_status.value,
                "reason": reason
            }
        )

        return payment

    async def get_invoice(self, order_id: uuid.UUID) -> Dict[str, Any]:
        """
        Generate invoice payload for an order.
        """
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found."
            )

        restaurant_res = await self.db.execute(select(Restaurant).where(Restaurant.id == order.restaurant_id))
        restaurant = restaurant_res.scalars().first()

        items = [
            {
                "name": item.item_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.subtotal
            }
            for item in order.items
        ]

        return {
            "restaurant_name": restaurant.name if restaurant else "SmartServe Bistro",
            "restaurant_address": restaurant.address if restaurant else None,
            "restaurant_phone": restaurant.phone if restaurant else None,
            "restaurant_email": restaurant.email if restaurant else None,
            "gstin": restaurant.gstin if restaurant else None,
            "order_id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "table_name": order.table.table_number if order.table else None,
            "placed_at": order.placed_at,
            "payment_status": order.payment_status,
            "payment_method": order.payment_method,
            "transaction_id": order.payment.transaction_id if order.payment else None,
            "items": items,
            "subtotal": order.subtotal,
            "tax_amount": order.tax_amount,
            "service_charge": order.service_charge,
            "discount_amount": order.discount_amount,
            "total_amount": order.total_amount
        }
