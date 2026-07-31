"""
SmartServe Order Status Log Model
Tracks every order status transition for auditing and analytics.
"""

from typing import Optional
from sqlalchemy import Column, String, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
import uuid

from app.database.base import BaseModel
from app.models.order import OrderStatus


class OrderStatusLog(BaseModel):
    """
    OrderStatusLog tracks status changes of orders.
    """
    __tablename__ = "order_status_logs"

    order_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[OrderStatus] = Column(SQLEnum(OrderStatus), nullable=False)
    changed_by_user_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="status_logs", lazy="selectin")
    changed_by_user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<OrderStatusLog order={self.order_id} status={self.status.value}>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "status": self.status.value,
            "changed_by_user_id": str(self.changed_by_user_id) if self.changed_by_user_id else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
