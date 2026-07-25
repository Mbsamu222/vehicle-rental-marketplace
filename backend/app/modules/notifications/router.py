from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.models import Notification
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_notifications(
    unreadOnly: bool | None = Query(default=None),
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Notification.user_id == user.id]
    if unreadOnly:
        conditions.append(Notification.read_at.is_(None))

    stmt = (
        select(Notification)
        .where(*conditions)
        .order_by(Notification.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    notifications = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Notification).where(*conditions))).scalar_one()
    unread_count = (
        await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        )
    ).scalar_one()

    meta = pagination_meta(pagination.page, pagination.limit, total)
    meta["unreadCount"] = unread_count
    return success_response([orm_to_dict(n) for n in notifications], meta=meta)


@router.patch("/{id}/read")
async def mark_read(id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification)
        .where(Notification.id == id, Notification.user_id == user.id)
        .values(read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return success_response({"message": "Marked as read"})


@router.patch("/read-all")
async def mark_all_read(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return success_response({"message": "All notifications marked as read"})
