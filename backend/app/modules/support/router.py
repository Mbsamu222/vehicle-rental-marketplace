from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import SupportTicketStatus, UserType
from app.db.models import RentalPartner, SupportTicket, SupportTicketMessage
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.support.schemas import AddMessageInput, CreateTicketInput, UpdateTicketStatusInput

router = APIRouter(dependencies=[Depends(get_current_user)])

admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))
manage_support = Depends(require_permission("support.manage"))


async def _get_ticket_with_access_check(db: AsyncSession, ticket_id: str, user: AuthUser) -> SupportTicket:
    stmt = (
        select(SupportTicket)
        .where(SupportTicket.id == ticket_id)
        .options(selectinload(SupportTicket.messages).selectinload(SupportTicketMessage.author))
    )
    ticket = (await db.execute(stmt)).scalar_one_or_none()
    if ticket is None:
        raise ApiError.not_found("Support ticket not found")
    is_admin = user.user_type in (UserType.ADMIN, UserType.SUPER_ADMIN)
    if ticket.user_id != user.id and not is_admin:
        raise ApiError.forbidden()
    return ticket


def _serialize_ticket(ticket: SupportTicket, *, messages: bool = False, user: bool = False) -> dict:
    extra: dict = {}
    if messages:
        ordered = sorted(ticket.messages, key=lambda m: m.created_at)
        extra["messages"] = [
            orm_to_dict(m, extra={"author": sanitize_user(m.author) if m.author is not None else None}) for m in ordered
        ]
    if user:
        extra["user"] = sanitize_user(ticket.user) if ticket.user is not None else None
    return orm_to_dict(ticket, extra=extra)


@router.post("", status_code=201)
async def create(payload: CreateTicketInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user.id))).scalar_one_or_none()

    ticket = SupportTicket(
        user_id=user.id, rental_partner_id=partner.id if partner is not None else None, subject=payload.subject
    )
    db.add(ticket)
    await db.flush()
    db.add(SupportTicketMessage(ticket_id=ticket.id, author_id=user.id, message=payload.message))
    await db.commit()
    await db.refresh(ticket, attribute_names=["messages"])
    return success_response(orm_to_dict(ticket, extra={"messages": [orm_to_dict(m) for m in ticket.messages]}), 201)


@router.get("/mine")
async def list_mine(
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(SupportTicket)
        .where(SupportTicket.user_id == user.id)
        .order_by(SupportTicket.updated_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    tickets = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(select(func.count()).select_from(SupportTicket).where(SupportTicket.user_id == user.id))
    ).scalar_one()
    return success_response(
        [orm_to_dict(t) for t in tickets], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.get("/{id}")
async def get_by_id(id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ticket = await _get_ticket_with_access_check(db, id, user)
    return success_response(_serialize_ticket(ticket, messages=True))


@router.post("/{id}/messages", status_code=201)
async def add_message(
    id: UuidPath, payload: AddMessageInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    await _get_ticket_with_access_check(db, id, user)
    message = SupportTicketMessage(ticket_id=id, author_id=user.id, message=payload.message)
    db.add(message)
    ticket = await db.get(SupportTicket, id)
    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(message)
    return success_response(orm_to_dict(message), 201)


@router.get("", dependencies=[admin_only, manage_support])
async def list_all(
    status: SupportTicketStatus | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SupportTicket).options(selectinload(SupportTicket.user))
    count_stmt = select(func.count()).select_from(SupportTicket)
    if status is not None:
        stmt = stmt.where(SupportTicket.status == status)
        count_stmt = count_stmt.where(SupportTicket.status == status)
    stmt = stmt.order_by(SupportTicket.updated_at.desc()).offset(pagination.skip).limit(pagination.take)

    tickets = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(count_stmt)).scalar_one()
    return success_response(
        [_serialize_ticket(t, user=True) for t in tickets],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.patch("/{id}/status", dependencies=[admin_only, manage_support])
async def update_status(id: UuidPath, payload: UpdateTicketStatusInput, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(SupportTicket, id)
    if ticket is None:
        raise ApiError.not_found()
    ticket.status = SupportTicketStatus(payload.status)
    await db.commit()
    await db.refresh(ticket)
    return success_response(orm_to_dict(ticket))
