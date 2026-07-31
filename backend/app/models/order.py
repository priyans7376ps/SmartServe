"""
SmartServe Order Model
Represents customer orders with complete lifecycle tracking.
"""

from typing import Optional, List
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, Text, ForeignKey, DateTime, Enum as SQLEnum, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped
import uuid
from app.database.base import BaseModel


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class OrderType(str, enum.Enum):
    DINE_IN = "dine_in"
    TAKEAWAY = "takeaway"
    DELIVERY = "delivery"


class Order(BaseModel):
    __tablename__ = "orders"

    restaurant_id: Mapped[uuid.UUID] = Column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    table_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("tables.id"), nullable=True, index=True)
    order_number: Mapped[str] = Column(String(50), unique=True, nullable=False, index=True)

    order_type: Mapped[OrderType] = Column(SQLEnum(OrderType), default=OrderType.DINE_IN, nullable=False)
    status: Mapped[OrderStatus] = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)

    customer_name: Mapped[Optional[str]] = Column(String(255), nullable=True)
    customer_phone: Mapped[Optional[str]] = Column(String(20), nullable=True)
    customer_email: Mapped[Optional[str]] = Column(String(255), nullable=True)

    subtotal: Mapped[float] = Column(Float, nullable=False, default=0.0)
    tax_amount: Mapped[float] = Column(Float, nullable=False, default=0.0)
    service_charge: Mapped[float] = Column(Float, nullable=False, default=0.0)
    delivery_fee: Mapped[float] = Column(Float, nullable=False, default=0.0)
    discount_amount: Mapped[float] = Column(Float, nullable=False, default=0.0)
    total_amount: Mapped[float] = Column(Float, nullable=False, default=0.0)

    payment_status: Mapped[str] = Column(String(50), default="pending", nullable=False)
    payment_method: Mapped[Optional[str]] = Column(String(50), nullable=True)

    coupon_id: Mapped[Optional[uuid.UUID]] = Column(UUID(as_uuid=True), ForeignKey("coupons.id"), nullable=True)
    coupon_code: Mapped[Optional[str]] = Column(String(50), nullable=True)

    notes: Mapped[Optional[str]] = Column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = Column(Text, nullable=True)
    cancellation_reason: Mapped[Optional[str]] = Column(Text, nullable=True)

    estimated_preparation_time: Mapped[Optional[int]] = Column(Integer, nullable=True)
    placed_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    confirmed_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    preparing_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    ready_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)

    restaurant = relationship("Restaurant", back_populates="orders", lazy="selectin")
    user = relationship("User", back_populates="orders", lazy="selectin")
    table = relationship("Table", back_populates="orders", lazy="selectin")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
    status_logs = relationship("OrderStatusLog", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
    payment = relationship("Payment", back_populates="order", uselist=False, lazy="selectin")
    coupon = relationship("Coupon", lazy="selectin")
