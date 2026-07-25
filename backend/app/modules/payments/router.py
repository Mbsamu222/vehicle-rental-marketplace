from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import PaymentProvider, TransactionType, UserType
from app.db.models import Booking, Payment, Transaction, Wallet
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.payments import service
from app.modules.payments.schemas import CreatePaymentOrderInput, RefundPaymentInput, VerifyPaymentInput

router = APIRouter(dependencies=[Depends(get_current_user)])

customer_only = Depends(require_user_type(UserType.CUSTOMER))
admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))


@router.post("/orders", dependencies=[customer_only], status_code=201)
async def create_order(
    payload: CreatePaymentOrderInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await service.create_payment_order(db, payload.bookingId, user.id, PaymentProvider(payload.provider))
    return success_response({"payment": orm_to_dict(result["payment"]), "providerConfig": result["providerConfig"]}, 201)


@router.post("/verify", dependencies=[customer_only])
async def verify(payload: VerifyPaymentInput, db: AsyncSession = Depends(get_db)):
    payment = await service.verify_payment(db, payload.paymentId, payload.providerRefId, payload.providerSignature)
    return success_response(orm_to_dict(payment))


@router.get("/mine", dependencies=[customer_only])
async def list_my_payments(
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Payment)
        .join(Booking, Payment.booking_id == Booking.id)
        .where(Booking.customer_id == user.id)
        .options(selectinload(Payment.booking))
        .order_by(Payment.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    payments = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(
            select(func.count())
            .select_from(Payment)
            .join(Booking, Payment.booking_id == Booking.id)
            .where(Booking.customer_id == user.id)
        )
    ).scalar_one()

    return success_response(
        [orm_to_dict(p, extra={"booking": orm_to_dict(p.booking)}) for p in payments],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.get("/wallet", dependencies=[customer_only])
async def get_wallet(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Wallet).where(Wallet.user_id == user.id).options(selectinload(Wallet.transactions))
    wallet = (await db.execute(stmt)).scalar_one_or_none()
    if wallet is None:
        raise ApiError.not_found("Wallet not found")

    recent = sorted(wallet.transactions, key=lambda t: t.created_at, reverse=True)[:50]
    return success_response(orm_to_dict(wallet, extra={"transactions": [orm_to_dict(t) for t in recent]}))


@router.get("/transactions", dependencies=[admin_only, Depends(require_permission("payments.view"))])
async def list_transactions(
    type: str | None = Query(default=None),
    rentalPartnerId: str | None = Query(default=None),
    customerId: str | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    conditions = []
    if type:
        conditions.append(Transaction.type == TransactionType(type))
    if rentalPartnerId:
        conditions.append(Transaction.rental_partner_id == rentalPartnerId)

    stmt = select(Transaction)
    count_stmt = select(func.count()).select_from(Transaction)
    if customerId:
        # A customer's transactions are either payment-linked (Transaction -> Payment -> Booking.customer_id)
        # or wallet-linked (Transaction -> Wallet.user_id); a plain join would miss whichever side is null.
        stmt = stmt.outerjoin(Payment, Transaction.payment_id == Payment.id).outerjoin(
            Booking, Payment.booking_id == Booking.id
        ).outerjoin(Wallet, Transaction.wallet_id == Wallet.id)
        count_stmt = count_stmt.outerjoin(Payment, Transaction.payment_id == Payment.id).outerjoin(
            Booking, Payment.booking_id == Booking.id
        ).outerjoin(Wallet, Transaction.wallet_id == Wallet.id)
        conditions.append(or_(Booking.customer_id == customerId, Wallet.user_id == customerId))

    stmt = stmt.where(*conditions).order_by(Transaction.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    transactions = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(count_stmt.where(*conditions))).scalar_one()

    return success_response(
        [orm_to_dict(t) for t in transactions], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.post("/{id}/refund", dependencies=[admin_only, Depends(require_permission("payments.refund"))])
async def refund(id: UuidPath, payload: RefundPaymentInput, db: AsyncSession = Depends(get_db)):
    amount = Decimal(str(payload.amount)) if payload.amount is not None else None
    payment = await service.refund_payment(db, id, amount, payload.reason)
    return success_response(orm_to_dict(payment))
