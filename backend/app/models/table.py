"""
SmartServe Table Model

Represents restaurant tables with capacity tracking,
QR code integration, and seating management.
"""

from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, mapped_column, Mapped
import uuid

from app.database.base import BaseModel


class Table(BaseModel):
    """
    Table model for restaurant table management.
    Supports QR code generation for guest ordering.
    """
    
    __tablename__ = "tables"
    
    # Restaurant association
    restaurant_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    
    # Table identification
    table_number: Mapped[int] = Column(Integer, nullable=False)
    table_name: Mapped[Optional[str]] = Column(String(100), nullable=True)
    section: Mapped[Optional[str]] = Column(String(100), nullable=True)  # indoor, outdoor, bar
    
    # Capacity
    capacity: Mapped[int] = Column(Integer, default=4, nullable=False, server_default='4')
    min_capacity: Mapped[int] = Column(Integer, default=1, nullable=False, server_default='1')
    max_capacity: Mapped[int] = Column(Integer, default=8, nullable=False, server_default='8')
    
    # Status
    is_occupied: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_active: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    is_reserved: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    is_smoking: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    
    # Device and QR Code Integration
    qr_code: Mapped[Optional[str]] = Column(String(500), nullable=True)
    device_id: Mapped[Optional[str]] = Column(String(255), nullable=True, index=True)
    status: Mapped[str] = Column(String(50), default="available", nullable=False, server_default='available')

    # QR Code
    qr_code_url: Mapped[Optional[str]] = Column(String(500), nullable=True)
    qr_code_data: Mapped[Optional[str]] = Column(String(500), nullable=True)  # Encoded data for QR
    
    # Location
    floor: Mapped[int] = Column(Integer, default=1, nullable=False, server_default='1')
    x_position: Mapped[Optional[float]] = Column(Float, nullable=True)
    y_position: Mapped[Optional[float]] = Column(Float, nullable=True)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="tables", lazy="selectin")
    orders = relationship("Order", back_populates="table", lazy="selectin")
    
    __table_args__ = (
        UniqueConstraint('restaurant_id', 'table_number', name='uq_table_restaurant_number'),
    )
    
    def __repr__(self) -> str:
        return f"<Table {self.table_number} (Capacity: {self.capacity})>"
    
    @property
    def status_label(self) -> str:
        """Get the status label for the table."""
        if self.is_occupied:
            return "occupied"
        elif self.is_reserved:
            return "reserved"
        return "available"
    
    def to_dict(self) -> dict:
        """Convert table to dictionary."""
        return {
            "id": str(self.id),
            "restaurant_id": str(self.restaurant_id),
            "table_number": self.table_number,
            "table_name": self.table_name,
            "section": self.section,
            "capacity": self.capacity,
            "status": self.status_label,
            "is_active": self.is_active,
            "floor": self.floor,
            "qr_code_url": self.qr_code_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
