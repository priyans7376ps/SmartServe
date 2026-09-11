from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, status, Request, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.deps import get_db, get_current_user, get_current_admin, get_optional_current_user
from app.models.user import User
from app.services.payment_service import PaymentService
from app.schemas.payment import (
    CreateRazorpayOrderRequest,
    CreateRazorpayOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    RefundPaymentRequest,
    PaymentResponse,
    InvoiceResponse,
)

router = APIRouter()


@router.post(
    "/create-order",
    response_model=CreateRazorpayOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Razorpay order for checkout"
)
async def create_razorpay_order(
    payload: CreateRazorpayOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    service = PaymentService(db)
    return await service.create_razorpay_order(payload.order_id, user=current_user)


@router.post(
    "/verify",
    response_model=VerifyPaymentResponse,
    summary="Verify Razorpay payment signature server-side"
)
async def verify_payment(
    payload: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    service = PaymentService(db)
    return await service.verify_payment(
        order_id=payload.order_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
        admin_user=current_user
    )


@router.post(
    "/webhook/razorpay",
    status_code=status.HTTP_200_OK,
    summary="Razorpay Webhook Event Handler"
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db)
):
    body_bytes = await request.body()
    service = PaymentService(db)

    if x_razorpay_signature:
        is_valid = service.verify_webhook_signature(body_bytes, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay webhook signature"
            )

    import json
    try:
        event_data = json.loads(body_bytes.decode('utf-8'))
    except Exception:
        event_data = {}

    return await service.process_webhook(event_data)


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentResponse,
    summary="Admin refund payment"
)
async def refund_payment(
    payment_id: uuid.UUID,
    payload: RefundPaymentRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    service = PaymentService(db)
    return await service.process_refund(
        payment_id=payment_id,
        amount=payload.amount,
        reason=payload.reason,
        admin_user=admin_user
    )


@router.get(
    "/invoice/{order_id}",
    response_model=InvoiceResponse,
    summary="Get invoice details for an order"
)
async def get_invoice(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = PaymentService(db)
    return await service.get_invoice(order_id)


@router.get(
    "/",
    response_model=List[PaymentResponse],
    summary="List payments (Admin)"
)
async def list_payments(
    query: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    service = PaymentService(db)
    items, _ = await service.payment_repo.search_payments(
        query=query, status=status, method=method, skip=skip, limit=limit
    )
    return items


@router.post(
    "/retry/{order_id}",
    response_model=CreateRazorpayOrderResponse,
    summary="Retry payment for an unpaid order"
)
async def retry_payment(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    service = PaymentService(db)
    return await service.create_razorpay_order(order_id, user=current_user)
