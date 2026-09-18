"""
SmartServe Restaurant Model

Represents the restaurant entity with configuration settings,
operating hours, and branding information.
"""

from datetime import time, datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Time,
    DateTime,
    Integer,
    Float,
    Text,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import UUID,  BaseModel, JSONB


class Restaurant(BaseModel):
    """
    Restaurant model for managing restaurant-wide settings,
    branding, and configuration.
    """
    
    __tablename__ = "restaurants"
    
    # Basic Information
    name: Mapped[str] = Column(String(255), nullable=False, index=True)
    slug: Mapped[str] = Column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    tagline: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Contact Information
    email: Mapped[Optional[str]] = Column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = Column(String(20), nullable=True)
    website: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Address
    address_line1: Mapped[Optional[str]] = Column(String(255), nullable=True)
    address_line2: Mapped[Optional[str]] = Column(String(255), nullable=True)
    city: Mapped[Optional[str]] = Column(String(100), nullable=True)
    state: Mapped[Optional[str]] = Column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = Column(String(20), nullable=True)
    country: Mapped[str] = Column(String(100), default="US", nullable=False)
    latitude: Mapped[Optional[float]] = Column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = Column(Float, nullable=True)
    
    # Branding
    logo_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    banner_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    favicon_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    primary_color: Mapped[Optional[str]] = Column(String(7), nullable=True)  # Hex color
    secondary_color: Mapped[Optional[str]] = Column(String(7), nullable=True)
    
    # Operating Hours
    opening_time: Mapped[Optional[time]] = Column(Time, nullable=True)
    closing_time: Mapped[Optional[time]] = Column(Time, nullable=True)
    opening_days: Mapped[Optional[dict]] = Column(JSONB, nullable=True)  # {"monday": True, ...}
    is_open: Mapped[bool] = Column(Boolean, default=True, nullable=False, server_default='true')
    
    # Business Settings
    currency: Mapped[str] = Column(String(3), default="USD", nullable=False)
    tax_rate: Mapped[float] = Column(Float, default=0.08, nullable=False, server_default='0.08')
    service_charge_rate: Mapped[float] = Column(
        Float, default=0.05, nullable=False, server_default='0.05'
    )
    max_tables: Mapped[int] = Column(Integer, default=50, nullable=False, server_default='50')
    max_capacity: Mapped[int] = Column(Integer, default=200, nullable=False, server_default='200')
    
    # Order Settings
    preparation_time_buffer: Mapped[int] = Column(
        Integer, default=5, nullable=False, server_default='5'
    )
    max_items_per_order: Mapped[int] = Column(
        Integer, default=50, nullable=False, server_default='50'
    )
    order_timeout_minutes: Mapped[int] = Column(
        Integer, default=30, nullable=False, server_default='30'
    )
    enable_online_ordering: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    enable_table_reservation: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    
    # Payment Settings
    accepted_payment_methods: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # ["cash", "card", "online"]
    stripe_publishable_key: Mapped[Optional[str]] = Column(String(500), nullable=True)
    stripe_secret_key: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Notification Settings
    enable_email_notifications: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    enable_sms_notifications: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    enable_push_notifications: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    
    # Feature Flags
    features: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=dict
    )  # {"loyalty_program": True, "coupons": True}
    
    # Status
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    subscription_tier: Mapped[str] = Column(
        String(50), default="basic", nullable=False, server_default='basic'
    )
    subscription_expires_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Relationships
    staff = relationship("User", back_populates="restaurant", lazy="select")
    tables = relationship("Table", back_populates="restaurant", lazy="select")
    categories = relationship("Category", back_populates="restaurant", lazy="select")
    menu_items = relationship("MenuItem", back_populates="restaurant", lazy="select")
    orders = relationship("Order", back_populates="restaurant", lazy="select")
    coupons = relationship("Coupon", back_populates="restaurant", lazy="select")
    
    def __repr__(self) -> str:
        return f"<Restaurant {self.name}>"
    
    @property
    def full_address(self) -> Optional[str]:
        """Get formatted full address."""
        parts = [self.address_line1, self.address_line2, self.city, self.state, self.postal_code]
        return ", ".join(filter(None, parts)) or None
    
    def to_dict(self) -> dict:
        """Convert restaurant to dictionary."""
        features = self.features or {}
        
        # Format opening and closing times as HH:MM
        op_time = "10:00"
        if isinstance(self.opening_time, time):
            op_time = self.opening_time.strftime("%H:%M")
        elif self.opening_time:
            op_time = str(self.opening_time)[:5]

        cl_time = "23:00"
        if isinstance(self.closing_time, time):
            cl_time = self.closing_time.strftime("%H:%M")
        elif self.closing_time:
            cl_time = str(self.closing_time)[:5]

        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug or "smartserve-bistro",
            "description": self.description,
            "tagline": self.tagline,
            "email": self.email,
            "phone": self.phone,
            "address": self.address_line1 or self.full_address or "124 Gourmet Boulevard, Tech Park",
            "address_line1": self.address_line1,
            "logo_url": self.logo_url or "",
            "banner_url": self.banner_url or "",
            "opening_time": op_time,
            "closing_time": cl_time,
            "is_open": self.is_open if self.is_open is not None else True,
            "currency": self.currency or "INR",
            "tax_rate": float(self.tax_rate) if self.tax_rate is not None else 0.05,
            "service_charge_rate": float(self.service_charge_rate) if self.service_charge_rate is not None else 0.0,
            "gstin": features.get("gstin") or getattr(self, "gstin", "27AAAAA0000A1Z5") or "27AAAAA0000A1Z5",
            "timezone": features.get("timezone") or "Asia/Kolkata",
            "is_active": self.is_active if self.is_active is not None else True,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
