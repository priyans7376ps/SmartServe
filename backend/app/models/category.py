"""
SmartServe Category Model

Represents menu item categories with ordering,
display preferences, and restaurant association.
"""

from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Text,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import BaseModel


class Category(BaseModel):
    """
    Category model for organizing menu items.
    Supports hierarchical categorization and display ordering.
    """
    
    __tablename__ = "categories"
    
    # Restaurant association
    restaurant_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    
    # Category details
    name: Mapped[str] = Column(String(100), nullable=False)
    slug: Mapped[str] = Column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    icon: Mapped[Optional[str]] = Column(String(100), nullable=True)  # Icon class or URL
    image_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    
    # Display settings
    display_order: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    is_featured: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    show_on_menu: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    
    # Parent category (for subcategories)
    parent_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )
    
    # Color theme
    color: Mapped[Optional[str]] = Column(String(7), nullable=True)  # Hex color
    background_color: Mapped[Optional[str]] = Column(String(7), nullable=True)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="categories", lazy="selectin")
    menu_items = relationship("MenuItem", back_populates="category", lazy="selectin")
    parent = relationship("Category", back_populates="children", remote_side="Category.id", lazy="selectin")
    children = relationship("Category", back_populates="parent", lazy="selectin")
    
    __table_args__ = (
        UniqueConstraint('restaurant_id', 'slug', name='uq_category_restaurant_slug'),
    )
    
    def __repr__(self) -> str:
        return f"<Category {self.name}>"
    
    @property
    def item_count(self) -> int:
        """Get the number of active menu items in this category."""
        return len([item for item in self.menu_items if item.is_active])
    
    @property
    def has_children(self) -> bool:
        """Check if category has subcategories."""
        return len(self.children) > 0
    
    def to_dict(self) -> dict:
        """Convert category to dictionary."""
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "icon": self.icon,
            "image_url": self.image_url,
            "display_order": self.display_order,
            "is_featured": self.is_featured,
            "is_active": self.is_active,
            "item_count": self.item_count,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
