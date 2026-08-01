from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.loyalty_repository import LoyaltyRepository
from app.schemas.customer import LoyaltyPointsResponse, PointsTransactionResponse

class LoyaltyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.loyalty_repo = LoyaltyRepository(db)

    async def get_points_balance(self, user_id: uuid.UUID) -> LoyaltyPointsResponse:
        account = await self.loyalty_repo.get_or_create_loyalty_account(user_id)
        return LoyaltyPointsResponse(
            current_balance=account.current_balance,
            current_tier=account.current_tier.value,
            total_points_earned=account.total_points_earned,
            total_points_redeemed=account.total_points_redeemed,
            tier_benefits=account.tier_benefits
        )

    async def get_points_history(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> List[PointsTransactionResponse]:
        txs = await self.loyalty_repo.get_transactions(user_id, skip=skip, limit=limit)
        return [
            PointsTransactionResponse(
                id=t.id,
                transaction_type=t.transaction_type.value,
                points=t.points,
                balance_after=t.balance_after,
                description=t.description,
                created_at=t.created_at
            )
            for t in txs
        ]
