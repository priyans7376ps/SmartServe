from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class CreateRazorpayOrderRequest(BaseModel):
    order_id: uuid.UUID
    notes: Optional[Dict[str, Any]] = None


class CreateRazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int  # in paise
    currency: str = "INR"
    razorpay_key_id: str
    order_id: uuid.UUID
    payment_id: uuid.UUID


class VerifyPaymentRequest(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    order_id: uuid.UUID
    payment_id: uuid.UUID
    order_status: str
    payment_status: str


class RefundPaymentRequest(BaseModel):
    amount: Optional[float] = Field(None, gt=0, description="Amount to refund. Null for full refund.")
    reason: Optional[str] = Field(None, max_length=500)


class RetryPaymentRequest(BaseModel):
    order_id: uuid.UUID


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    provider: str
    provider_order_id: Optional[str] = None
    provider_payment_id: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_method: str
    payment_status: str
    amount: float
    currency: str
    tax_amount: float = 0.0
    tip_amount: float = 0.0
    service_charge: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    billing_name: Optional[str] = None
    billing_email: Optional[str] = None
    paid_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    refund_amount: float = 0.0
    refund_reason: Optional[str] = None
    created_at: Optional[datetime] = None


class InvoiceItem(BaseModel):
    name: str
    quantity: int
    unit_price: float
    total_price: float


class InvoiceResponse(BaseModel):
    restaurant_name: str
    restaurant_address: Optional[str] = None
    restaurant_phone: Optional[str] = None
    restaurant_email: Optional[str] = None
    gstin: Optional[str] = None
    order_id: uuid.UUID
    order_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    table_name: Optional[str] = None
    placed_at: datetime
    payment_status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float
    tax_amount: float
    service_charge: float
    discount_amount: float
    total_amount: float
