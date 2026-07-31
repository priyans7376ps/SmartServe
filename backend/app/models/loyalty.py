"""
SmartServe Loyalty Model

Represents customer loyalty points and rewards program
with points tracking, redemption, and tier management.
"""

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone, timedelta
import enum

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
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


class LoyaltyTier(str, enum.Enum):
    """Loyalty program tiers."""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"


class PointsTransactionType(str, enum.Enum):
    """Types of points transactions."""
    EARNED = "earned"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    ADJUSTED = "adjusted"
    BONUS = "bonus"


class LoyaltyPoints(BaseModel):
    """
    Loyalty points account for customers.
    Tracks earned points, tier progression, and rewards.
    """
    
    __tablename__ = "loyalty_points"
    
    # User association
    user_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True
    )
    
    # Points balance
    total_points_earned: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    total_points_redeemed: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    total_points_expired: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    current_balance: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    
    # Tier information
    current_tier: Mapped[LoyaltyTier] = Column(
        SQLEnum(LoyaltyTier), default=LoyaltyTier.BRONZE, nullable=False
    )
    points_to_next_tier: Mapped[Optional[int]] = Column(Integer, nullable=True)
    tier_progress_percentage: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    
    # Lifetime value
    lifetime_spent: Mapped[float] = Column(
        Float, default=0.0, nullable=False, server_default='0.0'
    )
    total_orders: Mapped[int] = Column(
        Integer, default=0, nullable=False, server_default='0'
    )
    
    # Points expiry
    points_expiry_days: Mapped[int] = Column(
        Integer, default=365, nullable=False, server_default='365'
    )
    last_points_earned_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    last_points_redeemed_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    next_points_expiry_date: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Enrollment
    enrolled_at: Mapped[datetime] = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_enrolled: Mapped[bool] = Column(
        Boolean, default=True, nullable=False, server_default='true'
    )
    
    # Relationships
    user = relationship("User", back_populates="loyalty_points", lazy="selectin")
    transactions = relationship("PointsTransaction", back_populates="loyalty_points", 
                                lazy="selectin", cascade="all, delete-orphan")
    rewards = relationship("LoyaltyReward", back_populates="loyalty_points", 
                           lazy="selectin", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<LoyaltyPoints {self.user.email} ({self.current_tier.value}: {self.current_balance}pts)>"
    
    def add_points(self, points: int, description: str = ""):
        """Add points to balance."""
        self.current_balance += points
        self.total_points_earned += points
        self.last_points_earned_at = datetime.now(timezone.utc)
        self.update_tier()
    
    def redeem_points(self, points: int) -> bool:
        """Redeem points if sufficient balance."""
        if self.current_balance >= points:
            self.current_balance -= points
            self.total_points_redeemed += points
            self.last_points_redeemed_at = datetime.now(timezone.utc)
            return True
        return False
    
    def update_tier(self):
        """Update loyalty tier based on points."""
        if self.total_points_earned >= 10000:
            self.current_tier = LoyaltyTier.DIAMOND
        elif self.total_points_earned >= 5000:
            self.current_tier = LoyaltyTier.PLATINUM
        elif self.total_points_earned >= 2000:
            self.current_tier = LoyaltyTier.GOLD
        elif self.total_points_earned >= 500:
            self.current_tier = LoyaltyTier.SILVER
        else:
            self.current_tier = LoyaltyTier.BRONZE
    
    @property
    def tier_benefits(self) -> dict:
        """Get benefits for current tier."""
        benefits = {
            "bronze": {"points_multiplier": 1.0, "discount": 0, "free_delivery": False},
            "silver": {"points_multiplier": 1.2, "discount": 5, "free_delivery": False},
            "gold": {"points_multiplier": 1.5, "discount": 10, "free_delivery": True},
            "platinum": {"points_multiplier": 2.0, "discount": 15, "free_delivery": True},
            "diamond": {"points_multiplier": 3.0, "discount": 20, "free_delivery": True},
        }
        return benefits.get(self.current_tier.value, benefits["bronze"])
    
    def to_dict(self) -> dict:
        """Convert loyalty points to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "current_balance": self.current_balance,
            "current_tier": self.current_tier.value,
            "points_to_next_tier": self.points_to_next_tier,
            "tier_progress_percentage": self.tier_progress_percentage,
            "total_points_earned": self.total_points_earned,
            "total_points_redeemed": self.total_points_redeemed,
            "lifetime_spent": self.lifetime_spent,
            "total_orders": self.total_orders,
            "tier_benefits": self.tier_benefits,
            "is_enrolled": self.is_enrolled,
            "enrolled_at": self.enrolled_at.isoformat() if self.enrolled_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PointsTransaction(BaseModel):
    """
    Records individual points transactions for audit trail.
    """
    
    __tablename__ = "points_transactions"
    
    # Loyalty points association
    loyalty_points_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("loyalty_points.id"), nullable=False, index=True
    )
    
    # Transaction details
    transaction_type: Mapped[PointsTransactionType] = Column(
        SQLEnum(PointsTransactionType), nullable=False
    )
    points: Mapped[int] = Column(Integer, nullable=False)
    balance_before: Mapped[int] = Column(Integer, nullable=False)
    balance_after: Mapped[int] = Column(Integer, nullable=False)
    
    # Reference
    reference_type: Mapped[Optional[str]] = Column(String(50), nullable=True)  # order, reward, adjustment
    reference_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), nullable=True
    )
    
    # Description
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    
    # Relationships
    loyalty_points = relationship("LoyaltyPoints", back_populates="transactions", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<PointsTransaction {self.transaction_type.value}: {self.points}pts>"


class LoyaltyReward(BaseModel):
    """
    Available rewards that can be redeemed with points.
    """
    
    __tablename__ = "loyalty_rewards"
    
    # Loyalty points association
    loyalty_points_id: Mapped[uuid.UUID] = Column(
        UUID(as_uuid=True), ForeignKey("loyalty_points.id"), nullable=False, index=True
    )
    
    # Reward details
    name: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[Optional[str]] = Column(Text, nullable=True)
    points_required: Mapped[int] = Column(Integer, nullable=False)
    reward_type: Mapped[str] = Column(
        String(50), nullable=False, default="discount"
    )  # discount, free_item, free_delivery, other
    
    # Reward value
    discount_percentage: Mapped[Optional[float]] = Column(Float, nullable=True)
    discount_amount: Mapped[Optional[float]] = Column(Float, nullable=True)
    free_item_id: Mapped[Optional[uuid.UUID]] = Column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=True
    )
    
    # Redemption
    is_redeemed: Mapped[bool] = Column(
        Boolean, default=False, nullable=False, server_default='false'
    )
    redeemed_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = Column(
        DateTime(timezone=True), nullable=True
    )
    
    # Relationships
    loyalty_points = relationship("LoyaltyPoints", back_populates="rewards", lazy="selectin")
    free_item = relationship("MenuItem", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<LoyaltyReward {self.name} ({self.points_required}pts)>"
