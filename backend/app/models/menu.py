"""
SmartServe Menu Item Model

Represents individual menu items with pricing,
nutritional information, and availability tracking.
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
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import BaseModel


class MenuItem(BaseModel):
    """
    Menu item model for managing restaurant dishes and beverages.
    Supports variants, add-ons, and dietary preferences.
    """
    
    __tablename__ = "menu_items"
    
    # Restaurant association
    restaurant_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True
    )
    
    # Basic Information
    name: Mapped[str] = Column(String(255), nullable=False)
    slug: Mapped[str] = Column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Pricing
    price: Mapped[float] = Column(Float, nullable=False)
    compare_price: Mapped[Optional[float]] = Column(Float, nullable=True)  # Original price for discount display
    cost_price: Mapped[Optional[float]] = Column(Float, nullable=True)  # Internal cost tracking
    
    # Media
    image_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    image_urls: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=list)  # Multiple images
    video_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Availability
    is_available: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    is_todays_special: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_featured: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_vegetarian: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_vegan: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_gluten_free: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_spicy: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    
    # Preparation
    preparation_time: Mapped[int] = Column(
        Integer, default=15, nullable=False, server_default='15'
    )  # In minutes
    calories: Mapped[Optional[int]] = Column(Integer, nullable=True)
    allergens: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=list)  # ["dairy", "nuts", ...]
    
    # Inventory
    stock_quantity: Mapped[int] = Column(
        Integer, default=100, nullable=False, server_default='100'
    )
    low_stock_threshold: Mapped[int] = Column(
        Integer, default=10, nullable=False, server_default='10'
    )
    
    # Variants and Add-ons
    variants: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # [{"name": "Size", "options": ["Small", "Medium", "Large"]}]
    add_ons: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # [{"name": "Extra Cheese", "price": 1.50}]
    
    # Rating
    rating: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    rating_count: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    order_count: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    
    # Display
    display_order: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    tags: Mapped[Optional[dict]] = Column(
        JSONB, nullable=True, default=list
    )  # ["popular", "chef_special", "new"]
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="menu_items", lazy="selectin")
    category = relationship("Category", back_populates="menu_items", lazy="selectin")
    cart_items = relationship("CartItem", back_populates="menu_item", lazy="selectin")
    order_items = relationship("OrderItem", back_populates="menu_item", lazy="selectin")
    
    __table_args__ = (
        UniqueConstraint('restaurant_id', 'slug', name='uq_menu_item_restaurant_slug'),
    )
    
    def __repr__(self) -> str:
        return f"<MenuItem {self.name} (${self.price})>"
    
    @property
    def is_low_stock(self) -> bool:
        """Check if item is low on stock."""
        return self.stock_quantity <= self.low_stock_threshold
    
    @property
    def is_out_of_stock(self) -> bool:
        """Check if item is out of stock."""
        return self.stock_quantity <= 0
    
    @property
    def discount_percentage(self) -> Optional[float]:
        """Calculate discount percentage if compare_price exists."""
        if self.compare_price and self.compare_price > self.price:
            return round(((self.compare_price - self.price) / self.compare_price) * 100, 1)
        return None
    
    def to_dict(self) -> dict:
        """Convert menu item to dictionary."""
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "category_id": str(self.category_id),
            "category_name": self.category.name if self.category else None,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "short_description": self.short_description,
            "price": self.price,
            "compare_price": self.compare_price,
            "discount_percentage": self.discount_percentage,
            "image_url": self.image_url,
            "image_urls": self.image_urls,
            "is_available": self.is_available,
            "is_todays_special": self.is_todays_special,
            "is_featured": self.is_featured,
            "is_vegetarian": self.is_vegetarian,
            "is_vegan": self.is_vegan,
            "is_gluten_free": self.is_gluten_free,
            "is_spicy": self.is_spicy,
            "preparation_time": self.preparation_time,
            "calories": self.calories,
            "allergens": self.allergens,
            "rating": self.rating,
            "rating_count": self.rating_count,
            "order_count": self.order_count,
            "variants": self.variants,
            "add_ons": self.add_ons,
            "tags": self.tags,
            "display_order": self.display_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
