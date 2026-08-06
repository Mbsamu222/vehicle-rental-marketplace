from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.money import round_money
from app.core.responses import ApiError
from app.db.enums import BookingStatus, MonetizationFeatureKey, TransactionStatus, TransactionType
from app.db.models import Booking, RentalPartner, Transaction
from app.modules.monetization import service as monetization_service
from app.modules.subscriptions.service import get_active_subscription




async def get_effective_commission_rate(db: AsyncSession, partner: RentalPartner) -> Decimal:
    """An active subscription plan's `features.commissionOverride` takes
    precedence over the partner's flat `commission_rate`, but only once
    PARTNER_SUBSCRIPTIONS is enabled — before that, behavior is unchanged."""
    if await monetization_service.is_enabled(db, MonetizationFeatureKey.PARTNER_SUBSCRIPTIONS):
        subscription = await get_active_subscription(db, partner.id)
        if subscription is not None and subscription.plan.features:
            override = subscription.plan.features.get("commissionOverride")
            if override is not None:
                return Decimal(str(override))
    return partner.commission_rate


async def record_booking_commission(db: AsyncSession, booking: Booking) -> None:
    """Called from bookings/service.transition_status() when a booking completes.
    No-op (and no Transaction created) unless BOOKING_COMMISSION is enabled —
    behavior stays byte-identical to today until an admin opts in. Commission is
    computed on the rental price only (base_price - discount), never on tax or
    the refundable security deposit, since neither of those belongs to revenue
    the platform/partner actually earned."""
    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.BOOKING_COMMISSION):
        return

    partner = await db.get(RentalPartner, booking.rental_partner_id)
    if partner is None:
        return

    rate = await get_effective_commission_rate(db, partner)
    commission_base = booking.base_price - booking.discount_amount
    commission_amount = round_money(commission_base * rate / Decimal(100))

    db.add(
        Transaction(
            type=TransactionType.COMMISSION,
            status=TransactionStatus.SUCCESS,
            amount=commission_amount,
            rental_partner_id=partner.id,
            reference=booking.booking_number,
        )
    )


def _compute_payout_fee(amount: Decimal, config: dict) -> Decimal:
    fee_type = config.get("type", "PERCENTAGE")
    value = Decimal(str(config.get("value", 0)))
    fee = amount * value / Decimal(100) if fee_type == "PERCENTAGE" else value
    cap = config.get("cap")
    if cap is not None:
        fee = min(fee, Decimal(str(cap)))
    return round_money(max(fee, Decimal("0")))


async def create_payout(db: AsyncSession, rental_partner_id: str, actor_id: str) -> Transaction:
    partner = await db.get(RentalPartner, rental_partner_id)
    if partner is None:
        raise ApiError.not_found("Rental partner not found")

    stmt = select(Booking).where(
        Booking.rental_partner_id == rental_partner_id,
        Booking.status == BookingStatus.COMPLETED,
        Booking.payout_transaction_id.is_(None),
    )
    bookings = (await db.execute(stmt)).scalars().all()
    if not bookings:
        raise ApiError.bad_request("No uncollected earnings for this partner")

    # Commission is only deducted while BOOKING_COMMISSION is enabled — matches
    # record_booking_commission's own gate, so a payout never silently keeps a
    # cut that was never recorded anywhere as platform earnings.
    commission_enabled = await monetization_service.is_enabled(db, MonetizationFeatureKey.BOOKING_COMMISSION)
    rate = await get_effective_commission_rate(db, partner) if commission_enabled else Decimal("0")
    gross_total = Decimal("0")
    commission_total = Decimal("0")
    for booking in bookings:
        base = booking.base_price - booking.discount_amount
        commission = round_money(base * rate / Decimal(100))
        gross_total += base
        commission_total += commission

    net_before_fee = gross_total - commission_total

    payout_fee = Decimal("0")
    if await monetization_service.is_enabled(db, MonetizationFeatureKey.PAYOUT_FEE):
        config = await monetization_service.get_config(db, MonetizationFeatureKey.PAYOUT_FEE)
        payout_fee = _compute_payout_fee(net_before_fee, config)

    net_amount = net_before_fee - payout_fee

    payout = Transaction(
        type=TransactionType.PAYOUT,
        status=TransactionStatus.SUCCESS,
        amount=net_amount,
        rental_partner_id=rental_partner_id,
        transaction_metadata={
            "grossAmount": str(gross_total),
            "commission": str(commission_total),
            "payoutFee": str(payout_fee),
            "bookingCount": len(bookings),
            "createdById": actor_id,
        },
    )
    db.add(payout)
    await db.flush()

    for booking in bookings:
        booking.payout_transaction_id = payout.id

    await db.commit()
    await db.refresh(payout)
    return payout
