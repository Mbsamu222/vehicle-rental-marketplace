from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import BookingStatus, MonetizationFeatureKey, TransactionStatus, TransactionType
from app.db.models import MonetizationFeature, Transaction
from app.modules.bookings.service import cancel_booking, preview_cancellation, transition_status
from tests.factories import make_booking, make_payment, make_vehicle


async def _seed_features(db_session: AsyncSession, *enabled_with_config: tuple[MonetizationFeatureKey, dict]) -> None:
    enabled_keys = {key for key, _ in enabled_with_config}
    configs = dict(enabled_with_config)
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=key in enabled_keys, config=configs.get(key)))
    await db_session.commit()


CANCELLATION_TIERS = {
    "tiers": [
        {"hoursBeforePickup": 48, "feePercentage": 0},
        {"hoursBeforePickup": 24, "feePercentage": 25},
        {"hoursBeforePickup": 0, "feePercentage": 50},
    ]
}


async def test_cancel_with_toggle_off_refunds_in_full(db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED, base_price=Decimal("1000"))
    await make_payment(db_session, booking, amount=booking.total_amount)

    updated = await cancel_booking(db_session, booking.id, actor_id=booking.customer_id, reason="Changed my mind")

    assert updated.status == BookingStatus.CANCELLED
    assert updated.cancellation_fee_amount == Decimal("0")


async def test_cancel_within_24h_charges_fee_and_partially_refunds(db_session: AsyncSession) -> None:
    await _seed_features(db_session, (MonetizationFeatureKey.CANCELLATION_FEE, CANCELLATION_TIERS))
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(
        db_session,
        vehicle,
        status=BookingStatus.CONFIRMED,
        base_price=Decimal("1000"),
        pickup_datetime=datetime.now(timezone.utc) + timedelta(hours=5),
    )
    payment = await make_payment(db_session, booking, amount=booking.total_amount)

    preview = await preview_cancellation(db_session, booking.id, requester_id=booking.customer_id)
    assert preview["feeAmount"] == Decimal("500.00")  # 50% tier, under 24h
    assert preview["refundAmount"] == payment.amount - Decimal("500.00")

    updated = await cancel_booking(db_session, booking.id, actor_id=booking.customer_id, reason="Too late now")
    assert updated.cancellation_fee_amount == Decimal("500.00")

    await db_session.refresh(payment)
    assert payment.refunded_amount == preview["refundAmount"]


async def test_cancel_more_than_48h_out_is_free(db_session: AsyncSession) -> None:
    await _seed_features(db_session, (MonetizationFeatureKey.CANCELLATION_FEE, CANCELLATION_TIERS))
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(
        db_session,
        vehicle,
        status=BookingStatus.CONFIRMED,
        base_price=Decimal("1000"),
        pickup_datetime=datetime.now(timezone.utc) + timedelta(days=5),
    )
    payment = await make_payment(db_session, booking, amount=booking.total_amount)

    updated = await cancel_booking(db_session, booking.id, actor_id=booking.customer_id, reason=None)
    assert updated.cancellation_fee_amount == Decimal("0")

    await db_session.refresh(payment)
    assert payment.refunded_amount == payment.amount  # full refund


async def test_late_return_within_grace_period_records_no_fee(db_session: AsyncSession) -> None:
    await _seed_features(
        db_session, (MonetizationFeatureKey.LATE_RETURN_FEE, {"gracePeriodMinutes": 30, "perHourAmount": 100})
    )
    vehicle = await make_vehicle(db_session)
    scheduled_return = datetime.now(timezone.utc)
    booking = await make_booking(
        db_session, vehicle, status=BookingStatus.RETURNING, pickup_datetime=scheduled_return - timedelta(days=1), return_datetime=scheduled_return
    )

    actual_return = scheduled_return + timedelta(minutes=20)  # within the 30-minute grace period
    updated = await transition_status(
        db_session, booking.id, BookingStatus.COMPLETED, actor_id="partner-1", actual_return_at=actual_return
    )

    assert updated.late_return_fee_amount == Decimal("0")
    # SQLite (this test harness) hands back naive datetimes on read even for
    # timezone-aware columns, unlike the asyncpg/Postgres driver used in
    # production — normalize before comparing, per the harness's documented gap.
    assert updated.actual_return_at.replace(tzinfo=timezone.utc) == actual_return
    txns = (await db_session.execute(select(Transaction).where(Transaction.type == TransactionType.LATE_RETURN_FEE))).scalars().all()
    assert txns == []


async def test_late_return_past_grace_records_pending_fee_without_touching_payment(db_session: AsyncSession) -> None:
    await _seed_features(
        db_session, (MonetizationFeatureKey.LATE_RETURN_FEE, {"gracePeriodMinutes": 30, "perHourAmount": 100, "maxAmount": 1000})
    )
    vehicle = await make_vehicle(db_session)
    scheduled_return = datetime.now(timezone.utc)
    booking = await make_booking(
        db_session, vehicle, status=BookingStatus.RETURNING, pickup_datetime=scheduled_return - timedelta(days=1), return_datetime=scheduled_return
    )
    payment = await make_payment(db_session, booking, amount=booking.total_amount)

    actual_return = scheduled_return + timedelta(hours=2, minutes=30)  # 2.5h late minus 30min grace = 2h billable
    updated = await transition_status(
        db_session, booking.id, BookingStatus.COMPLETED, actor_id="partner-1", actual_return_at=actual_return
    )

    assert updated.late_return_fee_amount == Decimal("200.00")  # 2h * 100/hr
    txns = (await db_session.execute(select(Transaction).where(Transaction.type == TransactionType.LATE_RETURN_FEE))).scalars().all()
    assert len(txns) == 1
    assert txns[0].status == TransactionStatus.PENDING
    assert txns[0].amount == Decimal("200.00")

    # Record-only by design: no refund/wallet mutation happens for a late fee.
    await db_session.refresh(payment)
    assert payment.refunded_amount == Decimal("0")
    assert payment.status.value == "PAID"
