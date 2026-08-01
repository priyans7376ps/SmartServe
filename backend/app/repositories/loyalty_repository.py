from typing import Optional, List
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.loyalty import LoyaltyPoints, PointsTransaction, PointsTransactionType, LoyaltyTier
from app.repositories.base import BaseRepository

class LoyaltyRepository(BaseRepository[LoyaltyPoints]):
    def __init__(self, db: AsyncSession):
        super().__init__(LoyaltyPoints, db)

    async def get_by_user_id(self, user_id: uuid.UUID) -> Optional[LoyaltyPoints]:
        stmt = select(LoyaltyPoints).where(LoyaltyPoints.user_id == user_id)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_or_create_loyalty_account(self, user_id: uuid.UUID) -> LoyaltyPoints:
        account = await self.get_by_user_id(user_id)
        if not account:
            account = LoyaltyPoints(
                id=uuid.uuid4(),
                user_id=user_id,
                current_balance=0,
                total_points_earned=0,
                total_points_redeemed=0,
                current_tier=LoyaltyTier.BRONZE,
                is_enrolled=True
            )
            self.db.add(account)
            await self.db.commit()
            await self.db.refresh(account)
        return account

    async def add_points(self, user_id: uuid.UUID, points: int, reference_type: str = "order", reference_id: Optional[uuid.UUID] = None, description: str = "") -> PointsTransaction:
        account = await self.get_or_create_loyalty_account(user_id)
        old_balance = account.current_balance
        account.add_points(points, description)
        new_balance = account.current_balance

        tx = PointsTransaction(
            id=uuid.uuid4(),
            loyalty_points_id=account.id,
            transaction_type=PointsTransactionType.EARNED,
            points=points,
            balance_before=old_balance,
            balance_after=new_balance,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description or f"Earned {points} loyalty points"
        )
        self.db.add(account)
        self.db.add(tx)
        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def redeem_points(self, user_id: uuid.UUID, points: int, reference_type: str = "reward", reference_id: Optional[uuid.UUID] = None, description: str = "") -> Optional[PointsTransaction]:
        account = await self.get_or_create_loyalty_account(user_id)
        if account.current_balance < points:
            return None

        old_balance = account.current_balance
        account.redeem_points(points)
        new_balance = account.current_balance

        tx = PointsTransaction(
            id=uuid.uuid4(),
            loyalty_points_id=account.id,
            transaction_type=PointsTransactionType.REDEEMED,
            points=-points,
            balance_before=old_balance,
            balance_after=new_balance,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description or f"Redeemed {points} loyalty points"
        )
        self.db.add(account)
        self.db.add(tx)
        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def get_transactions(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> List[PointsTransaction]:
        account = await self.get_by_user_id(user_id)
        if not account:
            return []

        stmt = select(PointsTransaction).where(
            PointsTransaction.loyalty_points_id == account.id
        ).order_by(desc(PointsTransaction.created_at)).offset(skip).limit(limit)

        res = await self.db.execute(stmt)
        return list(res.scalars().all())
