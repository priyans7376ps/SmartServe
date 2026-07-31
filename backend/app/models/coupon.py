"""
SmartServe Coupon Model

Represents promotional coupons and discount codes with
usage tracking, expiry management, and validation rules.
"""

from typing import Optional, List, TYPE_CHECKING
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


class DiscountType(str, enum.Enum):
    """Types of discount calculations."""
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_SHIPPING = "free_shipping"
    BUY_ONE_GET_ONE = "buy_one_get_one"


class Coupon(BaseModel):
    """
    Coupon model for managing promotional discounts.
    Supports various discount types and usage restrictions.
    """
    
    __tablename__ = "coupons"
    
    # Restaurant association
    restaurant_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    
    # Coupon identification
    code: Mapped[str] = Column(
        String(50), unique=True, nullable=False, index=True
    )
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Discount configuration
    discount_type: Mapped[DiscountType] = Column(
        SQLEnum(DiscountType), default=DiscountType.PERCENTAGE, nullable=False
    )
    discount_value: Mapped[float] = Column(Float, nullable=False)  # Percentage or fixed amount
    max_discount_amount: Mapped[Optional[float]] = Column(Float, nullable=True)  # Max discount for percentage
    min_order_amount: Mapped[Optional[float]] = Column(Float, nullable=True)  # Minimum order value
    
    # Usage limits
    max_usage_count: Mapped[Optional[int]] = Column(
        Integer, nullable=True
    )  # Total times coupon can be used
    max_usage_per_user: Mapped[int] = Column(
        Integer, default=1, nullable=False, server_default='1'
    )
    used_count: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    
    # Validity
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    valid_from: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    valid_until: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Restrictions
    applicable_to: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=dict
    )  # {"categories": ["pizza"], "items": ["item_id"]}
    excluded_items: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # ["item_id1", "item_id2"]
    user_roles: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # ["customer", "admin"]
    first_time_only: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    
    # Metadata
    is_public: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )  # Visible to customers
    display_name: Mapped[Optional[str]] = Column(String(100), nullable=True)
    terms_conditions: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="coupons", lazy="selectin")
    usages = relationship("CouponUsage", back_populates="coupon", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Coupon {self.code} ({self.discount_type.value}: {self.discount_value})>"
    
    @property
    def is_valid(self) -> bool:
        """Check if coupon is currently valid."""
        now = datetime.now(timezone.utc)
        if not self.is_active:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_usage_count and self.used_count >= self.max_usage_count:
            return False
        return True
    
    @property
    def remaining_uses(self) -> Optional[int]:
        """Get remaining number of uses."""
        if self.max_usage_count:
            return self.max_usage_count - self.used_count
        return None
    
    def to_dict(self) -> dict:
        """Convert coupon to dictionary."""
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "code": self.code,
            "description": self.description,
            "discount_type": self.discount_type.value,
            "discount_value": self.discount_value,
            "max_discount_amount": self.max_discount_amount,
            "min_order_amount": self.min_order_amount,
            "is_valid": self.is_valid,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "remaining_uses": self.remaining_uses,
            "display_name": self.display_name,
            "terms_conditions": self.terms_conditions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CouponUsage(BaseModel):
    """
    Tracks coupon usage per user to enforce usage limits.
    """
    
    __tablename__ = "coupon_usages"
    
    # Associations
    coupon_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("coupons.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    order_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True
    )
    
    # Usage details
    discount_amount: Mapped[float] = Column(Float, nullable=False)
    order_amount: Mapped[float] = Column(Float, nullable=False)
    
    # Relationships
    coupon = relationship("Coupon", back_populates="usages", lazy="selectin")
    user = relationship("User", back_populates="coupon_usages", lazy="selectin")
    order = relationship("Order", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<CouponUsage {self.coupon.code} by {self.user.email}>"
