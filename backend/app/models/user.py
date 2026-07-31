"""
SmartServe User Model
Represents all user types (customer, kitchen staff, admin) with
role-based access control, profile management, and authentication fields.
"""

from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Enum as SQLEnum,
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped
import enum
import uuid

from app.database.base import BaseModel


class UserRole(str, enum.Enum):
    """User roles for role-based access control."""
    CUSTOMER = "customer"
    KITCHEN = "kitchen"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(BaseModel):
    """
    User model for authentication and profile management.
    """
    __tablename__ = "users"

    # Authentication fields
    email: Mapped[str] = Column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = Column(String(20), unique=True, nullable=True, index=True)
    hashed_password: Mapped[str] = Column(String(255), nullable=False)

    # Profile fields
    full_name: Mapped[str] = Column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = Column(String(500), nullable=True)

    # Role foreign key & enum
    role_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True
    )
    role_obj = relationship("Role", back_populates="users", lazy="selectin")

    role: Mapped[UserRole] = Column(
        SQLEnum(UserRole),
        default=UserRole.CUSTOMER,
        nullable=False,
        index=True,
    )

    # Status fields
    is_verified: Mapped[bool] = Column(Boolean, default=False, nullable=False, server_default='false')
    is_active: Mapped[bool] = Column(Boolean, default=True, nullable=False, server_default='true')
    is_locked: Mapped[bool] = Column(Boolean, default=False, nullable=False, server_default='false')

    # Timestamps
    last_login_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    last_activity_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    email_verified_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    phone_verified_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    locked_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)

    # Security
    failed_login_attempts: Mapped[int] = Column(Integer, default=0, nullable=False, server_default='0')
    password_changed_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True), nullable=True)
    refresh_token: Mapped[Optional[str]] = Column(String(500), nullable=True)

    # Preferences & Device info
    preferences: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=dict)
    device_token: Mapped[Optional[str]] = Column(String(500), nullable=True)
    device_type: Mapped[Optional[str]] = Column(String(50), nullable=True)

    # Relationships
    orders = relationship("Order", back_populates="user", lazy="selectin")
    cart = relationship("Cart", back_populates="user", uselist=False, lazy="selectin")
    payments = relationship("Payment", back_populates="user", lazy="selectin")
    complaints = relationship("Complaint", foreign_keys="Complaint.user_id", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="selectin")
    loyalty_points = relationship("LoyaltyPoints", back_populates="user", uselist=False, lazy="selectin")
    coupon_usages = relationship("CouponUsage", back_populates="user", lazy="selectin")

    restaurant_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=True
    )
    restaurant = relationship("Restaurant", back_populates="staff", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"

    @property
    def password_hash(self) -> str:
        return self.hashed_password

    @property
    def is_admin(self) -> bool:
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

    @property
    def is_kitchen_staff(self) -> bool:
        return self.role == UserRole.KITCHEN

    @property
    def is_customer(self) -> bool:
        return self.role == UserRole.CUSTOMER

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "email": self.email,
            "phone": self.phone,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "role": self.role.value,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }
