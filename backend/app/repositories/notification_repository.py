from typing import Optional, List
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationType, NotificationChannel
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_user_notifications(self, user_id: uuid.UUID, unread_only: bool = False, skip: int = 0, limit: int = 50) -> List[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        stmt = stmt.order_by(desc(Notification.created_at)).offset(skip).limit(limit)

        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        stmt = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        res = await self.db.execute(stmt)
        n = res.scalars().first()
        if n:
            n.mark_as_read()
            self.db.add(n)
            await self.db.commit()
            await self.db.refresh(n)
            return n
        return None

    async def create_notification(
        self,
        user_id: uuid.UUID,
        title: str,
        message: str,
        type: NotificationType = NotificationType.SYSTEM,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        related_id: Optional[uuid.UUID] = None,
        related_type: Optional[str] = None
    ) -> Notification:
        n = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            channel=channel,
            related_id=related_id,
            related_type=related_type,
            is_read=False,
            is_delivered=True
        )
        self.db.add(n)
        await self.db.commit()
        await self.db.refresh(n)
        return n
