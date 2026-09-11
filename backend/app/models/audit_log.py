"""
SmartServe AuditLog Model

Records all administrative actions (login, staff create/update/deactivate,
coupon create/update/delete, restaurant settings update, order cancelled,
complaint updated, payment refunds, etc.) for security auditing and compliance.
"""

from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped
import uuid

from app.database.base import UUID,  BaseModel, JSONB


class AuditLog(BaseModel):
    """
    AuditLog model storing audit records for administrative events.
    Excludes sensitive secrets, passwords, and authorization tokens.
    """
    __tablename__ = "audit_logs"

    admin_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    action: Mapped[str] = Column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = Column(String(100), nullable=False, index=True)
    resource_id: Mapped[Optional[str]] = Column(String(255), nullable=True, index=True)
    ip_address: Mapped[Optional[str]] = Column(String(45), nullable=True)
    details: Mapped[Optional[dict]] = Column(JSONB, nullable=True, default=dict)

    admin = relationship("User", foreign_keys=[admin_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.resource_type}:{self.resource_id}>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "admin_id": str(self.admin_id) if self.admin_id else None,
            "admin_name": self.admin.full_name if self.admin else "System",
            "admin_email": self.admin.email if self.admin else None,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": self.ip_address,
            "details": self.details or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
