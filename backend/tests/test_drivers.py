"""Driver hiring rules — availability, double-booking, pricing, accept/decline."""

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app.core.responses import ApiError
from app.db.enums import (
    AccountStatus,
    BookingStatus,
    DriverAssignmentStatus,
    DriverVerificationStatus,
    UserType,
)
from app.db.models import Driver, User
from app.modules.drivers import service
from tests.factories import make_booking, make_vehicle

pytestmark = pytest.mark.asyncio


async def make_driver(db, city_id, *, verified=True, available=True, daily=Decimal("800"), hourly=Decimal("100")):
    unique = uuid.uuid4().hex[:8]
    user = User(
        firebase_uid=f"fb-drv-{unique}",
        email=f"driver-{unique}@example.com",
        first_name="Ravi",
        last_name="K",
        user_type=UserType.DRIVER,
        account_status=AccountStatus.ACTIVE,
    )
    driver = Driver(
        user=user,
        city_id=city_id,
        license_number=f"DL-{unique}",
        license_expiry=datetime.now(timezone.utc) + timedelta(days=800),
        years_of_experience=5,
        daily_rate=daily,
        hourly_rate=hourly,
        verification_status=DriverVerificationStatus.VERIFIED if verified else DriverVerificationStatus.PENDING,
        is_available=available,
    )
    db.add_all([user, driver])
    await db.commit()
    await db.refresh(driver)
    return driver


async def test_prices_whole_days_plus_hourly_remainder(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)
    start = datetime.now(timezone.utc)
    # 1 day + 3 hours -> 800 + 3*100
    assert service.price_driver(driver, start, start + timedelta(days=1, hours=3)) == Decimal("1100.00")


async def test_only_verified_available_drivers_are_listed(db_session):
    vehicle = await make_vehicle(db_session)
    ok = await make_driver(db_session, vehicle.city_id)
    await make_driver(db_session, vehicle.city_id, verified=False)
    await make_driver(db_session, vehicle.city_id, available=False)

    start = datetime.now(timezone.utc) + timedelta(days=1)
    found = await service.find_available(db_session, city_id=vehicle.city_id, pickup=start, ret=start + timedelta(days=1))
    assert [d.id for d in found] == [ok.id]


async def test_hiring_adds_fee_to_booking_total(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)
    before = Decimal(booking.total_amount)

    assignment = await service.request_driver(db_session, booking=booking, driver_id=driver.id)

    assert assignment.status is DriverAssignmentStatus.REQUESTED
    assert booking.with_driver is True
    assert Decimal(booking.driver_fee_amount) == Decimal(assignment.agreed_amount)
    assert Decimal(booking.total_amount) == before + Decimal(assignment.agreed_amount)


async def test_unverified_driver_cannot_be_hired(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id, verified=False)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)

    with pytest.raises(ApiError):
        await service.request_driver(db_session, booking=booking, driver_id=driver.id)


async def test_driver_cannot_be_double_booked_for_overlapping_dates(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)

    first = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)
    await service.request_driver(db_session, booking=first, driver_id=driver.id)

    # Second booking overlapping the first's window.
    second = await make_booking(
        db_session,
        vehicle,
        status=BookingStatus.CONFIRMED,
        pickup_datetime=first.pickup_datetime + timedelta(hours=2),
        return_datetime=first.return_datetime + timedelta(hours=2),
    )
    with pytest.raises(ApiError):
        await service.request_driver(db_session, booking=second, driver_id=driver.id)


async def test_one_live_assignment_per_booking(db_session):
    vehicle = await make_vehicle(db_session)
    d1 = await make_driver(db_session, vehicle.city_id)
    d2 = await make_driver(db_session, vehicle.city_id)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)

    await service.request_driver(db_session, booking=booking, driver_id=d1.id)
    with pytest.raises(ApiError):
        await service.request_driver(db_session, booking=booking, driver_id=d2.id)


async def test_decline_refunds_the_fee_and_frees_the_booking(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)
    before = Decimal(booking.total_amount)

    assignment = await service.request_driver(db_session, booking=booking, driver_id=driver.id)
    await service.respond(db_session, assignment=assignment, booking=booking, accept=False, reason="Unwell")

    assert assignment.status is DriverAssignmentStatus.DECLINED
    assert booking.with_driver is False
    assert Decimal(booking.driver_fee_amount) == Decimal("0")
    assert Decimal(booking.total_amount) == before

    # And the booking can now be offered to someone else.
    other = await make_driver(db_session, vehicle.city_id)
    again = await service.request_driver(db_session, booking=booking, driver_id=other.id)
    assert again.status is DriverAssignmentStatus.REQUESTED


async def test_accept_keeps_the_fee(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)

    assignment = await service.request_driver(db_session, booking=booking, driver_id=driver.id)
    total_with_driver = Decimal(booking.total_amount)
    await service.respond(db_session, assignment=assignment, booking=booking, accept=True, reason=None)

    assert assignment.status is DriverAssignmentStatus.ACCEPTED
    assert booking.with_driver is True
    assert Decimal(booking.total_amount) == total_with_driver


async def test_cannot_respond_twice(db_session):
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)
    booking = await make_booking(db_session, vehicle, status=BookingStatus.CONFIRMED)
    a = await service.request_driver(db_session, booking=booking, driver_id=driver.id)
    await service.respond(db_session, assignment=a, booking=booking, accept=True, reason=None)

    with pytest.raises(ApiError):
        await service.respond(db_session, assignment=a, booking=booking, accept=False, reason=None)


async def test_driver_with_licence_expiring_mid_trip_is_excluded(db_session):
    """A licence must remain valid for the entire booking, not just at pickup."""
    vehicle = await make_vehicle(db_session)
    driver = await make_driver(db_session, vehicle.city_id)
    start = datetime.now(timezone.utc) + timedelta(days=1)
    driver.license_expiry = start + timedelta(hours=6)
    await db_session.commit()

    found = await service.find_available(
        db_session, city_id=vehicle.city_id, pickup=start, ret=start + timedelta(days=2)
    )
    assert driver.id not in {d.id for d in found}
