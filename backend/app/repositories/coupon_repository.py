from typing import Optional, List
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.coupon import Coupon, CouponUsage, DiscountType
from app.repositories.base import BaseRepository

class CouponRepository(BaseRepository[Coupon]):
    def __init__(self, db: AsyncSession):
        super().__init__(Coupon, db)

    async def get_by_code(self, code: str) -> Optional[Coupon]:
        stmt = select(Coupon).where(Coupon.code == code.upper())
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_public_active_coupons(self, restaurant_id: Optional[uuid.UUID] = None) -> List[Coupon]:
        now = datetime.now(timezone.utc)
        stmt = select(Coupon).where(
            and_(
                Coupon.is_active == True,
                Coupon.is_public == True
            )
        )
        if restaurant_id:
            stmt = stmt.where(Coupon.restaurant_id == restaurant_id)

        res = await self.db.execute(stmt)
        coupons = res.scalars().all()

        valid_coupons = []
        for c in coupons:
            if c.valid_from and now < c.valid_from:
                continue
            if c.valid_until and now > c.valid_until:
                continue
            if c.max_usage_count and c.used_count >= c.max_usage_count:
                continue
            valid_coupons.append(c)
        return valid_coupons

    async def get_user_coupon_usage_count(self, coupon_id: uuid.UUID, user_id: uuid.UUID) -> int:
        stmt = select(CouponUsage).where(
            and_(
                CouponUsage.coupon_id == coupon_id,
                CouponUsage.user_id == user_id
            )
        )
        res = await self.db.execute(stmt)
        return len(res.scalars().all())

    async def record_usage(self, coupon_id: uuid.UUID, user_id: uuid.UUID, order_id: Optional[uuid.UUID], discount_amount: float, order_amount: float) -> CouponUsage:
        coupon = await self.get_by_id(coupon_id)
        if coupon:
            coupon.used_count += 1
            self.db.add(coupon)

        usage = CouponUsage(
            id=uuid.uuid4(),
            coupon_id=coupon_id,
            user_id=user_id,
            order_id=order_id,
            discount_amount=discount_amount,
            order_amount=order_amount
        )
        self.db.add(usage)
        await self.db.commit()
        await self.db.refresh(usage)
        return usage
