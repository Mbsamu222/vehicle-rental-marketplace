from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import NotificationChannel
from app.db.models import Notification


async def notify(
    db: AsyncSession,
    user_id: str,
    title: str,
    message: str,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    data: dict | None = None,
) -> Notification:
    notification = Notification(user_id=user_id, title=title, message=message, channel=channel, data=data)
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
