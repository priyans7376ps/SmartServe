"""
SmartServe Role Model
Represents user permissions and system roles (ADMIN, KITCHEN, CUSTOMER).
"""

from typing import List, Optional
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship, Mapped
from app.database.base import BaseModel


class Role(BaseModel):
    """
    Role model for role-based access control.
    """
    __tablename__ = "roles"

    name: Mapped[str] = Column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)

    # Relationships
    users = relationship("User", back_populates="role_obj", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Role {self.name}>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
