"""
SmartServe Complaint Model

Represents customer complaints and feedback with
resolution tracking and escalation management.
"""

from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
import enum

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
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


class ComplaintStatus(str, enum.Enum):
    """Complaint resolution status."""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"


class ComplaintPriority(str, enum.Enum):
    """Complaint priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Complaint(BaseModel):
    """
    Complaint model for managing customer feedback and issues.
    Supports full lifecycle management from submission to resolution.
    """
    
    __tablename__ = "complaints"
    
    # User and order associations
    user_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    order_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True
    )
    
    # Complaint details
    subject: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[str] = Column(Text, nullable=False)
    category: Mapped[str] = Column(
        String(100), nullable=False, default="other"
    )  # food_quality, service, delivery, billing, other
    
    # Priority and status
    priority: Mapped[ComplaintPriority] = Column(
        SQLEnum(ComplaintPriority), default=ComplaintPriority.MEDIUM, nullable=False
    )
    status: Mapped[ComplaintStatus] = Column(
        SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False
    )
    
    # Media attachments
    attachments: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # URLs of uploaded images/documents
    
    # Resolution
    resolution_notes: Mapped[Optional[str]] = Column(Text, nullable=True)
    resolved_by: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Escalation
    is_escalated: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    escalated_to: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    escalated_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    escalation_reason: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Feedback
    customer_feedback: Mapped[Optional[str]] = Column(Text, nullable=True)
    customer_rating: Mapped[Optional[int]] = Column(
        Integer, nullable=True
    )  # 1-5 rating after resolution
    is_satisfied: Mapped[Optional[bool]] = Column(Boolean, nullable=True)
    
    # Communication
    contact_email: Mapped[Optional[str]] = Column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = Column(String(20), nullable=True)
    preferred_contact_method: Mapped[str] = Column(
        String(50), default="email", nullable=False, server_default='email'
    )
    
    # Metadata
    extra_metadata: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=dict)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="complaints", lazy="selectin")
    order = relationship("Order", lazy="selectin")
    resolver = relationship(
        "User", foreign_keys=[resolved_by], lazy="selectin"
    )
    escalated_to_user = relationship(
        "User", foreign_keys=[escalated_to], lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Complaint {self.subject} ({self.status.value})>"
    
    @property
    def resolution_time_hours(self) -> Optional[float]:
        """Calculate time taken to resolve."""
        if self.resolved_at and self.created_at:
            delta = self.resolved_at - self.created_at
            return round(delta.total_seconds() / 3600, 2)
        return None
    
    def to_dict(self) -> dict:
        """Convert complaint to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "order_id": str(self.order_id) if self.order_id else None,
            "subject": self.subject,
            "description": self.description,
            "category": self.category,
            "priority": self.priority.value,
            "status": self.status.value,
            "attachments": self.attachments,
            "resolution_notes": self.resolution_notes,
            "resolved_by": str(self.resolved_by) if self.resolved_by else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "is_escalated": self.is_escalated,
            "customer_feedback": self.customer_feedback,
            "customer_rating": self.customer_rating,
            "is_satisfied": self.is_satisfied,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
