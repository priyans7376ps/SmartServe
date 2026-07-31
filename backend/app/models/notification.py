"""
SmartServe Notification Model

Represents system notifications for all user types with
support for multiple channels and read tracking.
"""

from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
import enum

from sqlalchemy import (
    Column,
    String,
    Boolean,
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


class NotificationType(str, enum.Enum):
    """Types of notifications."""
    ORDER_UPDATE = "order_update"
    ORDER_STATUS = "order_status"
    NEW_ORDER = "new_order"
    PAYMENT = "payment"
    PROMOTION = "promotion"
    COUPON = "coupon"
    SYSTEM = "system"
    COMPLAINT = "complaint"
    KITCHEN = "kitchen"
    ADMIN = "admin"


class NotificationChannel(str, enum.Enum):
    """Delivery channels for notifications."""
    IN_APP = "in_app"
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"


class Notification(BaseModel):
    """
    Notification model for sending alerts and updates to users.
    Supports multiple channels and read tracking.
    """
    
    __tablename__ = "notifications"
    
    # User association
    user_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    
    # Related entity
    related_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    related_type: Mapped[Optional[str]] = Column(
        String(50), nullable=True
    )  # order, payment, complaint, etc.
    
    # Notification content
    type: Mapped[NotificationType] = Column(
        SQLEnum(NotificationType), nullable=False
    )
    channel: Mapped[NotificationChannel] = Column(
        SQLEnum(NotificationChannel), default=NotificationChannel.IN_APP, nullable=False
    )
    title: Mapped[str] = Column(String(255), nullable=False)
    message: Mapped[str] = Column(Text, nullable=False)
    body: Mapped[Optional[str]] = Column(Text, nullable=True)  # Longer description
    
    # Action
    action_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    action_label: Mapped[Optional[str]] = Column(String(100), nullable=True)
    
    # Icon and image
    icon: Mapped[Optional[str]] = Column(String(100), nullable=True)
    image_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Read status
    is_read: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    read_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Delivery status
    is_delivered: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    delivered_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    delivery_error: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Priority
    priority: Mapped[str] = Column(
        String(20), default="normal", nullable=False, server_default='normal'
    )  # low, normal, high, urgent
    
    # Expiry
    expires_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Metadata
    extra_metadata: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    user = relationship("User", back_populates="notifications", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Notification {self.title} ({self.type.value})>"
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.read_at = datetime.now(timezone.utc)
    
    def mark_as_delivered(self):
        """Mark notification as delivered."""
        self.is_delivered = True
        self.delivered_at = datetime.now(timezone.utc)
    
    def to_dict(self) -> dict:
        """Convert notification to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type.value,
            "channel": self.channel.value,
            "title": self.title,
            "message": self.message,
            "body": self.body,
            "action_url": self.action_url,
            "action_label": self.action_label,
            "icon": self.icon,
            "image_url": self.image_url,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "is_delivered": self.is_delivered,
            "priority": self.priority,
            "related_id": str(self.related_id) if self.related_id else None,
            "related_type": self.related_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
