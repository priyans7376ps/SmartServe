"""
SmartServe Cart Model

Represents shopping cart and cart items for customer ordering.
Supports guest and authenticated user carts with session management.
"""

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    ForeignKey,
    JSON,
    Text,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import BaseModel, TimestampMixin


class Cart(BaseModel):
    """
    Shopping cart for customers.
    Supports both authenticated and guest users.
    """
    
    __tablename__ = "carts"
    
    # User association (nullable for guest carts)
    user_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    
    # Session ID for guest users
    session_id: Mapped[Optional[str]] = Column(String(255), nullable=True, index=True)
    
    # Cart metadata
    notes: Mapped[Optional[str]] = Column(Text, nullable=True)
    table_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("tables.id"), nullable=True
    )
    
    # Status
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    is_converted: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )  # Converted to order
    converted_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Expiry
    expires_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Coupon
    coupon_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("coupons.id"), nullable=True
    )
    coupon_code: Mapped[Optional[str]] = Column(String(50), nullable=True)
    discount_amount: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    
    # Relationships
    user = relationship("User", back_populates="cart", lazy="selectin")
    items = relationship("CartItem", back_populates="cart", lazy="selectin", 
                         cascade="all, delete-orphan")
    coupon = relationship("Coupon", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<Cart {self.id} ({len(self.items)} items)>"
    
    @property
    def subtotal(self) -> float:
        """Calculate cart subtotal."""
        return sum(item.subtotal for item in self.items if item.is_active)
    
    @property
    def total_items(self) -> int:
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items if item.is_active)
    
    @property
    def total(self) -> float:
        """Calculate cart total with discount."""
        return max(0, self.subtotal - self.discount_amount)
    
    def to_dict(self) -> dict:
        """Convert cart to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "session_id": self.session_id,
            "items": [item.to_dict() for item in self.items if item.is_active],
            "subtotal": self.subtotal,
            "discount_amount": self.discount_amount,
            "total": self.total,
            "total_items": self.total_items,
            "notes": self.notes,
            "table_id": str(self.table_id) if self.table_id else None,
            "coupon_code": self.coupon_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CartItem(BaseModel):
    """
    Individual item in a shopping cart.
    Includes quantity, special instructions, and variant selections.
    """
    
    __tablename__ = "cart_items"
    
    # Cart association
    cart_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False, index=True
    )
    
    # Menu item association
    menu_item_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False
    )
    
    # Quantity
    quantity: Mapped[int] = Column(
        Integer, default=1, nullable=False, server_default='1'
    )
    
    # Price snapshot (in case menu price changes)
    unit_price: Mapped[float] = Column(Float, nullable=False)
    compare_price: Mapped[Optional[float]] = Column(Float, nullable=True)
    
    # Customization
    notes: Mapped[Optional[str]] = Column(Text, nullable=True)  # Special instructions
    variant_selected: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True
    )  # {"size": "Large", "temperature": "Hot"}
    add_ons_selected: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # [{"name": "Extra Cheese", "price": 1.50}]
    
    # Add-ons total
    add_ons_total: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    
    # Status
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    
    # Relationships
    cart = relationship("Cart", back_populates="items", lazy="selectin")
    menu_item = relationship("MenuItem", back_populates="cart_items", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<CartItem {self.menu_item.name} x{self.quantity}>"
    
    @property
    def subtotal(self) -> float:
        """Calculate item subtotal including add-ons."""
        return (self.unit_price + self.add_ons_total) * self.quantity
    
    @property
    def item_total(self) -> float:
        """Alias for subtotal."""
        return self.subtotal
    
    def to_dict(self) -> dict:
        """Convert cart item to dictionary."""
        return {
            "id": str(self.id),
            "cart_id": str(self.cart_id),
            "menu_item_id": str(self.menu_item_id),
            "menu_item_name": self.menu_item.name if self.menu_item else None,
            "menu_item_image": self.menu_item.image_url if self.menu_item else None,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "compare_price": self.compare_price,
            "subtotal": self.subtotal,
            "notes": self.notes,
            "variant_selected": self.variant_selected,
            "add_ons_selected": self.add_ons_selected,
            "add_ons_total": self.add_ons_total,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
