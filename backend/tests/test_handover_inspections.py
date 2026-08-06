"""Service-level tests for handover inspections.

These rules are the whole point of the feature — a deposit deduction is only
defensible if the evidence can't be back-dated, replaced, or fabricated with an
impossible odometer reading. Each one is asserted here.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.core.responses import ApiError
from app.db.enums import BookingStatus, FuelLevel, InspectionType
from app.db.models import BookingInspection, InspectionPhoto
from app.modules.bookings import handover_service as service
from tests.factories import make_booking, make_vehicle

pytestmark = pytest.mark.asyncio


async def _record(db, booking, inspection_type, *, odometer_km=1000, photos=None, acknowledged=False):
    return await service.record_inspection(
        db,
        booking=booking,
        inspection_type=inspection_type,
        odometer_km=odometer_km,
        fuel_level=FuelLevel.FULL,
        exterior_notes=None,
        interior_notes=None,
        damage_notes=None,
        customer_acknowledged=acknowledged,
        photos=photos or [],
        recorded_by_id=booking.rental_partner_id,
    )


async def test_records_pickup_inspection_with_photos(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.VEHICLE_READY)

    inspection = await _record(
        db_session,
        booking,
        InspectionType.PICKUP,
        odometer_km=12_500,
        photos=[{"url": "https://cdn/front.jpg", "label": "front"}, {"url": "https://cdn/odo.jpg", "label": "odometer"}],
        acknowledged=True,
    )

    assert inspection.odometer_km == 12_500
    assert inspection.customer_acknowledged is True

    photos = (
        (await db_session.execute(select(InspectionPhoto).where(InspectionPhoto.inspection_id == inspection.id)))
        .scalars()
        .all()
    )
    assert {p.label for p in photos} == {"front", "odometer"}


async def test_rejects_pickup_inspection_before_handover(db_session):
    """A partner must not be able to file condition evidence while the booking
    is still merely CONFIRMED — the customer hasn't seen the vehicle yet."""
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)

    with pytest.raises(ApiError):
        await _record(db_session, booking, InspectionType.PICKUP)


async def test_inspection_is_immutable(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.PICKED_UP)
    await _record(db_session, booking, InspectionType.PICKUP, odometer_km=500)

    with pytest.raises(ApiError):
        await _record(db_session, booking, InspectionType.PICKUP, odometer_km=900)


async def test_return_requires_pickup_first(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.RETURNING)

    with pytest.raises(ApiError):
        await _record(db_session, booking, InspectionType.RETURN)


async def test_return_odometer_cannot_go_backwards(db_session):
    """Guards against a typo or a fabricated reading that would understate
    distance travelled."""
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)
    await _record(db_session, booking, InspectionType.PICKUP, odometer_km=20_000)

    with pytest.raises(ApiError):
        await _record(db_session, booking, InspectionType.RETURN, odometer_km=19_999)


async def test_distance_travelled_derived_from_both_reports(db_session):
    vehicle = await make_vehicle(db_session)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.ACTIVE)

    await _record(db_session, booking, InspectionType.PICKUP, odometer_km=10_000)
    # Only one report so far -> unknown, not zero.
    one_sided = (
        (await db_session.execute(select(BookingInspection).where(BookingInspection.booking_id == booking.id)))
        .scalars()
        .all()
    )
    assert service.distance_travelled(list(one_sided)) is None

    await _record(db_session, booking, InspectionType.RETURN, odometer_km=10_342)
    both = (
        (await db_session.execute(select(BookingInspection).where(BookingInspection.booking_id == booking.id)))
        .scalars()
        .all()
    )
    assert service.distance_travelled(list(both)) == 342
