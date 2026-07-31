"""
SmartServe Database Base Module

Declarative base class and common mixins for all SQLAlchemy models.
Provides timestamp columns, UUID primary keys, and other shared utilities.
"""

from datetime import datetime, timezone
import uuid
from typing import Any

from sqlalchemy import Column, DateTime, String, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """
    Custom declarative base with common features.
    """
    
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name (snake_case)."""
        import re
        # Convert CamelCase to snake_case
        name = re.sub(r'(?<!^)(?=[A-Z])', '_', cls.__name__).lower()
        # Handle common pluralizations
        if not name.endswith('s'):
            name += 's'
        return name
    
    def dict(self) -> dict[str, Any]:
        """Convert model instance to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamp columns."""
    
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        server_default=func.now(),
        server_onupdate=func.now(),
    )


class SoftDeleteMixin:
    """Mixin that adds soft delete capability."""
    
    is_deleted = Column(Boolean, default=False, nullable=False, server_default='false')
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class UUIDMixin:
    """Mixin that adds UUID primary key."""
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )


class StatusMixin:
    """Mixin that adds status tracking."""
    
    status = Column(String(50), default='active', nullable=False, index=True)


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """
    Base model with UUID primary key and timestamps.
    All models should inherit from this.
    """
    __abstract__ = True
    
    is_active = Column(Boolean, default=True, nullable=False, server_default='true')

