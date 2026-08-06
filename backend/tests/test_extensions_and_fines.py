"""Service-level tests for booking extensions and traffic fines."""

from datetime import timedelta
from decimal import Decimal

import pytest

from sqlalchemy import select

from app.core.responses import ApiError
from app.db.enums import BookingStatus, ExtensionStatus, MonetizationFeatureKey, TrafficFineStatus
from app.db.models import MonetizationFeature, Notification
from app.modules.bookings import handover_service as service
from tests.factories import make_booking, make_vehicle

pytestmark = pytest.mark.asyncio


async def _seed_features(db_session) -> None:
    """`get_booking_fee_config` reads every feature row, so they must all exist.

    All disabled here: an extension should be priced on the rental rate alone
    unless a surcharge feature is explicitly switched on. Mirrors the helper in
    test_cancellation_late_return_integration.py.
    """
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=False, config=None))
    await db_session.commit()


# ── Extensions ───────────────────────────────────────────────────────────


async def test_extension_prices_only_the_extra_window(db_session):
    """A 1-day extension on a 1000/day vehicle should charge for the extra day,
    not re-charge the original booking or take a second deposit."""
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    original_total = Decimal(booking.total_amount)

    extension = await service.request_extension(
        db_session, booking=booking, requested_return=booking.return_datetime + timedelta(days=1)
    )

    assert extension.status is ExtensionStatus.PENDING
    # 1 extra day at price_per_day=1000, plus 18% tax, no deposit.
    assert Decimal(extension.additional_amount) == Decimal("1180.00")
    # Booking total is untouched until the request is approved.
    assert Decimal(booking.total_amount) == original_total


async def test_extension_rejected_for_non_active_booking(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)

    with pytest.raises(ApiError):
        await service.request_extension(
            db_session, booking=booking, requested_return=booking.return_datetime + timedelta(days=1)
        )


async def test_extension_must_be_later_than_current_return(db_session):
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)

    with pytest.raises(ApiError):
        await service.request_extension(
            db_session, booking=booking, requested_return=booking.return_datetime - timedelta(hours=1)
        )


async def test_only_one_pending_extension_at_a_time(db_session):
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    await service.request_extension(
        db_session, booking=booking, requested_return=booking.return_datetime + timedelta(days=1)
    )

    with pytest.raises(ApiError):
        await service.request_extension(
            db_session, booking=booking, requested_return=booking.return_datetime + timedelta(days=2)
        )


async def test_extension_blocked_by_a_conflicting_booking(db_session):
    """The vehicle is already promised to someone else for the extra window."""
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    # Another confirmed booking starting right when this one ends.
    await make_booking(
        db_session,
        vehicle,
        status=BookingStatus.CONFIRMED,
        pickup_datetime=booking.return_datetime + timedelta(hours=1),
        return_datetime=booking.return_datetime + timedelta(days=2),
    )

    with pytest.raises(ApiError):
        await service.request_extension(
            db_session, booking=booking, requested_return=booking.return_datetime + timedelta(days=1)
        )


async def test_approving_extension_moves_return_and_adds_charge(db_session):
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    original_total = Decimal(booking.total_amount)
    new_return = booking.return_datetime + timedelta(days=1)

    extension = await service.request_extension(db_session, booking=booking, requested_return=new_return)
    decided = await service.decide_extension(
        db_session, extension=extension, booking=booking, approve=True, rejection_reason=None, actor_id="admin-1"
    )

    assert decided.status is ExtensionStatus.APPROVED
    assert booking.return_datetime == new_return
    assert Decimal(booking.total_amount) == original_total + Decimal(extension.additional_amount)


async def test_rejecting_extension_leaves_booking_untouched(db_session):
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    original_return = booking.return_datetime
    original_total = Decimal(booking.total_amount)

    extension = await service.request_extension(
        db_session, booking=booking, requested_return=original_return + timedelta(days=1)
    )
    decided = await service.decide_extension(
        db_session, extension=extension, booking=booking, approve=False, rejection_reason="Already booked", actor_id="p1"
    )

    assert decided.status is ExtensionStatus.REJECTED
    assert decided.rejection_reason == "Already booked"
    assert booking.return_datetime == original_return
    assert Decimal(booking.total_amount) == original_total


async def test_extension_cannot_be_decided_twice(db_session):
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    extension = await service.request_extension(
        db_session, booking=booking, requested_return=booking.return_datetime + timedelta(days=1)
    )
    await service.decide_extension(
        db_session, extension=extension, booking=booking, approve=True, rejection_reason=None, actor_id="p1"
    )

    with pytest.raises(ApiError):
        await service.decide_extension(
            db_session, extension=extension, booking=booking, approve=False, rejection_reason=None, actor_id="p1"
        )


# ── Traffic fines ────────────────────────────────────────────────────────


async def test_fine_recorded_within_rental_period_notifies_customer(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.COMPLETED)
    during = booking.pickup_datetime + timedelta(hours=3)

    fine = await service.record_traffic_fine(
        db_session,
        booking=booking,
        violation_at=during,
        amount=Decimal("1500"),
        challan_number="TN-CH-99",
        description="Overspeeding",
        evidence_url=None,
        recorded_by_id="admin-1",
    )

    assert fine.status is TrafficFineStatus.PENDING
    assert fine.challan_number == "TN-CH-99"

    notes = (
        (await db_session.execute(select(Notification).where(Notification.user_id == booking.customer_id)))
        .scalars()
        .all()
    )
    assert any("challan" in n.message.lower() for n in notes)


async def test_fine_outside_rental_period_is_rejected(db_session):
    """A violation from before pickup or after return isn't this renter's."""
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.COMPLETED)

    with pytest.raises(ApiError):
        await service.record_traffic_fine(
            db_session,
            booking=booking,
            violation_at=booking.pickup_datetime - timedelta(hours=1),
            amount=Decimal("500"),
            challan_number=None,
            description=None,
            evidence_url=None,
            recorded_by_id="admin-1",
        )


async def test_late_return_extends_fine_liability_window(db_session):
    """`actual_return_at` beats the scheduled return: a renter who kept the car
    late is still liable for a violation in that overrun."""
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.COMPLETED)
    booking.actual_return_at = booking.return_datetime + timedelta(days=1)
    await db_session.commit()

    after_scheduled = booking.return_datetime + timedelta(hours=6)
    fine = await service.record_traffic_fine(
        db_session,
        booking=booking,
        violation_at=after_scheduled,
        amount=Decimal("800"),
        challan_number=None,
        description="Parking",
        evidence_url=None,
        recorded_by_id="admin-1",
    )
    assert fine.id is not None


async def test_fine_status_can_be_progressed(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.COMPLETED)
    fine = await service.record_traffic_fine(
        db_session,
        booking=booking,
        violation_at=booking.pickup_datetime + timedelta(hours=1),
        amount=Decimal("300"),
        challan_number=None,
        description=None,
        evidence_url=None,
        recorded_by_id="admin-1",
    )

    updated = await service.update_traffic_fine_status(
        db_session, fine=fine, status=TrafficFineStatus.DEDUCTED_FROM_DEPOSIT
    )
    assert updated.status is TrafficFineStatus.DEDUCTED_FROM_DEPOSIT
