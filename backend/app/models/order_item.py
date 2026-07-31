"""
SmartServe Order Item Model

Represents individual items within an order with pricing,
customization, and preparation tracking.
"""

from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    Text,
    ForeignKey,
    JSON,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import BaseModel


class OrderItem(BaseModel):
    """
    Order item model for tracking individual items within an order.
    Includes price snapshots, customization, and preparation status.
    """
    
    __tablename__ = "order_items"
    
    # Order association
    order_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True
    )
    
    # Menu item association
    menu_item_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False
    )
    
    # Item details
    item_name: Mapped[str] = Column(String(255), nullable=False)  # Snapshot of menu item name
    item_description: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Quantity and pricing
    quantity: Mapped[int] = Column(
        Integer, default=1, nullable=False, server_default='1'
    )
    unit_price: Mapped[float] = Column(Float, nullable=False)  # Price at time of order
    compare_price: Mapped[Optional[float]] = Column(Float, nullable=True)
    subtotal: Mapped[float] = Column(Float, nullable=False)
    
    # Customization
    notes: Mapped[Optional[str]] = Column(Text, nullable=True)  # Special instructions
    variant_selected: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True
    )  # {"size": "Large", "temperature": "Hot"}
    add_ons_selected: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # [{"name": "Extra Cheese", "price": 1.50}]
    add_ons_total: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    
    # Preparation status
    preparation_status: Mapped[str] = Column(
        String(50), default="pending", nullable=False, server_default='pending'
    )  # pending, preparing, ready, completed, cancelled
    preparation_started_at: Mapped[Optional[DateTime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    preparation_completed_at: Mapped[Optional[DateTime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    preparation_notes: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Assigned chef/staff
    assigned_to: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    
    # Relationships
    order = relationship("Order", back_populates="items", lazy="selectin")
    menu_item = relationship("MenuItem", back_populates="order_items", lazy="selectin")
    assigned_staff = relationship("User", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<OrderItem {self.item_name} x{self.quantity}>"
    
    @property
    def total_price(self) -> float:
        """Calculate total price for this item."""
        return self.subtotal
    
    def to_dict(self) -> dict:
        """Convert order item to dictionary."""
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "menu_item_id": str(self.menu_item_id),
            "item_name": self.item_name,
            "item_description": self.item_description,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "compare_price": self.compare_price,
            "subtotal": self.subtotal,
            "notes": self.notes,
            "variant_selected": self.variant_selected,
            "add_ons_selected": self.add_ons_selected,
            "add_ons_total": self.add_ons_total,
            "preparation_status": self.preparation_status,
            "preparation_notes": self.preparation_notes,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
