"""
SmartServe Payment Model

Represents payment transactions with support for multiple
payment methods, refunds, and transaction tracking.
"""

from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
import enum

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    Text,
    ForeignKey,
    DateTime,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import BaseModel


class PaymentStatus(str, enum.Enum):
    """Payment status lifecycle."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    """Supported payment methods."""
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"
    UPI = "upi"
    WALLET = "wallet"


class Payment(BaseModel):
    """
    Payment model for tracking financial transactions.
    Supports multiple payment methods, refunds, and gateway integration.
    """
    
    __tablename__ = "payments"
    
    # Order and user associations
    order_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True, unique=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    
    # Payment identification
    transaction_id: Mapped[Optional[str]] = Column(
        String(255), unique=True, nullable=True, index=True
    )  # External gateway transaction ID
    payment_intent_id: Mapped[Optional[str]] = Column(
        String(255), nullable=True, index=True
    )  # Stripe payment intent ID
    
    # Payment details
    payment_method: Mapped[PaymentMethod] = Column(
        SQLEnum(PaymentMethod), nullable=False
    )
    payment_status: Mapped[PaymentStatus] = Column(
        SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False
    )
    
    # Amounts
    amount: Mapped[float] = Column(Float, nullable=False)
    currency: Mapped[str] = Column(String(3), default="USD", nullable=False)
    tax_amount: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    tip_amount: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    service_charge: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    discount_amount: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    total_amount: Mapped[float] = Column(Float, nullable=False)
    
    # Gateway response
    gateway_response: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=dict
    )  # Full response from payment gateway
    gateway_status: Mapped[Optional[str]] = Column(String(100), nullable=True)
    gateway_message: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Card details (masked)
    card_last_four: Mapped[Optional[str]] = Column(String(4), nullable=True)
    card_brand: Mapped[Optional[str]] = Column(String(50), nullable=True)
    card_expiry_month: Mapped[Optional[int]] = Column(Integer, nullable=True)
    card_expiry_year: Mapped[Optional[int]] = Column(Integer, nullable=True)
    
    # Billing details
    billing_name: Mapped[Optional[str]] = Column(String(255), nullable=True)
    billing_email: Mapped[Optional[str]] = Column(String(255), nullable=True)
    billing_phone: Mapped[Optional[str]] = Column(String(20), nullable=True)
    billing_address: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=dict)
    
    # Timing
    paid_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    refunded_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Refund
    refund_amount: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    refund_reason: Mapped[Optional[str]] = Column(Text, nullable=True)
    refund_transaction_id: Mapped[Optional[str]] = Column(String(255), nullable=True)
    
    # Receipt
    receipt_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    receipt_number: Mapped[Optional[str]] = Column(String(100), nullable=True)
    
    # Metadata
    extra_metadata: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    order = relationship("Order", back_populates="payment", lazy="selectin")
    user = relationship("User", back_populates="payments", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Payment {self.transaction_id} ({self.payment_status.value})>"
    
    @property
    def is_refunded(self) -> bool:
        """Check if payment is fully refunded."""
        return self.payment_status == PaymentStatus.REFUNDED
    
    @property
    def is_partially_refunded(self) -> bool:
        """Check if payment is partially refunded."""
        return self.payment_status == PaymentStatus.PARTIALLY_REFUNDED
    
    @property
    def remaining_amount(self) -> float:
        """Calculate remaining amount after refunds."""
        return self.total_amount - self.refund_amount
    
    def to_dict(self) -> dict:
        """Convert payment to dictionary."""
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "transaction_id": self.transaction_id,
            "payment_method": self.payment_method.value,
            "payment_status": self.payment_status.value,
            "amount": self.amount,
            "currency": self.currency,
            "tax_amount": self.tax_amount,
            "tip_amount": self.tip_amount,
            "service_charge": self.service_charge,
            "discount_amount": self.discount_amount,
            "total_amount": self.total_amount,
            "card_last_four": self.card_last_four,
            "card_brand": self.card_brand,
            "billing_name": self.billing_name,
            "billing_email": self.billing_email,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "refund_amount": self.refund_amount,
            "refund_reason": self.refund_reason,
            "receipt_url": self.receipt_url,
            "receipt_number": self.receipt_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
