from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import TransactionType, UserType
from app.db.models import RentalPartner, Transaction
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.payouts import service
from app.modules.payouts.schemas import CreatePayoutInput

router = APIRouter()

admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))
partner_only = Depends(require_user_type(UserType.RENTAL_PARTNER))
manage_payouts = Depends(require_permission("payouts.manage"))


@router.post("", dependencies=[admin_only, manage_payouts], status_code=201)
async def create_payout(payload: CreatePayoutInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    payout = await service.create_payout(db, payload.rentalPartnerId, user.id)
    return success_response(orm_to_dict(payout), 201)


@router.get("", dependencies=[admin_only, manage_payouts])
async def list_payouts(pagination: Pagination = Depends(get_pagination()), db: AsyncSession = Depends(get_db)):
    conditions = [Transaction.type == TransactionType.PAYOUT]
    stmt = (
        select(Transaction).where(*conditions).order_by(Transaction.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    )
    payouts = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Transaction).where(*conditions))).scalar_one()
    return success_response(
        [orm_to_dict(p) for p in payouts], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.get("/mine", dependencies=[partner_only])
async def list_my_payouts(
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user.id))).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner profile not found")

    conditions = [Transaction.type == TransactionType.PAYOUT, Transaction.rental_partner_id == partner.id]
    stmt = (
        select(Transaction).where(*conditions).order_by(Transaction.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    )
    payouts = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Transaction).where(*conditions))).scalar_one()
    return success_response(
        [orm_to_dict(p) for p in payouts], meta=pagination_meta(pagination.page, pagination.limit, total)
    )
