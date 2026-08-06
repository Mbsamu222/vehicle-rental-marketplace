"""Driver registration, verification, discovery, and booking assignment."""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetimes import ensure_aware
from app.core.money import round_money
from app.core.responses import ApiError
from app.db.enums import (
    BookingStatus,
    DriverAssignmentStatus,
    DriverVerificationStatus,
    UserType,
)
from app.db.models import Booking, Driver, DriverAssignment, User
from app.modules.notifications import service as notification_service

# A driver already committed to one of these cannot take an overlapping job.
BLOCKING_ASSIGNMENT_STATUSES = (DriverAssignmentStatus.REQUESTED, DriverAssignmentStatus.ACCEPTED)


async def create_profile(db: AsyncSession, user_id: str, payload: dict) -> Driver:
    existing = (await db.execute(select(Driver).where(Driver.user_id == user_id))).scalar_one_or_none()
    if existing is not None:
        raise ApiError.conflict("A driver profile already exists for this account")

    duplicate = (
        await db.execute(select(Driver).where(Driver.license_number == payload["licenseNumber"]))
    ).scalar_one_or_none()
    if duplicate is not None:
        raise ApiError.conflict("That licence number is already registered")

    expiry = ensure_aware(payload["licenseExpiry"])
    if expiry <= datetime.now(timezone.utc):
        raise ApiError.bad_request("The driving licence has already expired")

    driver = Driver(
        user_id=user_id,
        city_id=payload["cityId"],
        license_number=payload["licenseNumber"],
        license_expiry=expiry,
        years_of_experience=payload.get("yearsOfExperience", 0),
        daily_rate=Decimal(str(payload["dailyRate"])),
        hourly_rate=Decimal(str(payload["hourlyRate"])),
        bio=payload.get("bio"),
        photo_url=payload.get("photoUrl"),
        languages=payload.get("languages"),
        verification_status=DriverVerificationStatus.PENDING,
    )
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    return driver


async def get_by_user(db: AsyncSession, user_id: str) -> Driver:
    driver = (await db.execute(select(Driver).where(Driver.user_id == user_id))).scalar_one_or_none()
    if driver is None:
        raise ApiError.not_found("Driver profile not found")
    return driver


def price_driver(driver: Driver, pickup: datetime, ret: datetime) -> Decimal:
    """Charges whole days at the daily rate and the remainder hourly.

    Deliberately the same shape as vehicle pricing in bookings/service.py, so a
    chauffeur-driven quote is predictable next to the rental line.
    """
    hours = (ensure_aware(ret) - ensure_aware(pickup)).total_seconds() / 3600
    if hours <= 0:
        raise ApiError.bad_request("Return time must be after pickup time")
    full_days = int(hours // 24)
    remaining = hours - full_days * 24
    # Partial hours round up — a driver's time can't be bought in fractions.
    remaining_hours = int(remaining) + (1 if remaining % 1 else 0)
    return round_money(Decimal(full_days) * driver.daily_rate + Decimal(remaining_hours) * driver.hourly_rate)


async def find_available(
    db: AsyncSession, *, city_id: str, pickup: datetime, ret: datetime
) -> list[Driver]:
    """Verified, available drivers in the city with no clashing assignment."""
    pickup, ret = ensure_aware(pickup), ensure_aware(ret)

    busy = (
        await db.execute(
            select(DriverAssignment.driver_id)
            .join(Booking, Booking.id == DriverAssignment.booking_id)
            .where(
                DriverAssignment.status.in_(BLOCKING_ASSIGNMENT_STATUSES),
                Booking.pickup_datetime < ret,
                Booking.return_datetime > pickup,
            )
        )
    ).scalars().all()

    stmt = select(Driver).where(
        Driver.city_id == city_id,
        Driver.verification_status == DriverVerificationStatus.VERIFIED,
        Driver.is_available.is_(True),
        Driver.is_active.is_(True),
        Driver.license_expiry > ret,  # licence must stay valid for the whole trip
    )
    if busy:
        stmt = stmt.where(Driver.id.notin_(set(busy)))
    return list((await db.execute(stmt.order_by(Driver.average_rating.desc()))).scalars().all())


async def request_driver(db: AsyncSession, *, booking: Booking, driver_id: str) -> DriverAssignment:
    driver = await db.get(Driver, driver_id)
    if driver is None:
        raise ApiError.not_found("Driver not found")
    if driver.verification_status is not DriverVerificationStatus.VERIFIED:
        raise ApiError.bad_request("That driver is not verified yet")

    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED):
        raise ApiError.bad_request(f"Cannot assign a driver to a {booking.status.value} booking")

    live = (
        await db.execute(
            select(DriverAssignment).where(
                DriverAssignment.booking_id == booking.id,
                DriverAssignment.status.in_(BLOCKING_ASSIGNMENT_STATUSES),
            )
        )
    ).scalar_one_or_none()
    if live is not None:
        raise ApiError.conflict("This booking already has a driver requested or assigned")

    available = await find_available(
        db, city_id=driver.city_id, pickup=booking.pickup_datetime, ret=booking.return_datetime
    )
    if driver.id not in {d.id for d in available}:
        raise ApiError.conflict("That driver is not available for this booking's dates")

    amount = price_driver(driver, booking.pickup_datetime, booking.return_datetime)
    assignment = DriverAssignment(
        booking_id=booking.id, driver_id=driver.id, agreed_amount=amount,
        status=DriverAssignmentStatus.REQUESTED,
    )
    db.add(assignment)

    booking.with_driver = True
    booking.driver_fee_amount = amount
    booking.total_amount = round_money(Decimal(booking.total_amount) + amount)

    await db.commit()
    await db.refresh(assignment)

    await notification_service.notify(
        db,
        user_id=driver.user_id,
        title="New driving job",
        message=f"You have been requested for booking {booking.booking_number}.",
        data={"bookingId": booking.id, "assignmentId": assignment.id},
    )
    return assignment


async def respond(
    db: AsyncSession, *, assignment: DriverAssignment, booking: Booking, accept: bool, reason: str | None
) -> DriverAssignment:
    if assignment.status is not DriverAssignmentStatus.REQUESTED:
        raise ApiError.bad_request(f"This request was already {assignment.status.value.lower()}")

    assignment.status = DriverAssignmentStatus.ACCEPTED if accept else DriverAssignmentStatus.DECLINED
    assignment.decline_reason = None if accept else reason
    assignment.responded_at = datetime.now(timezone.utc)

    if not accept:
        # Roll the fee back off the booking so the customer isn't billed for a
        # driver who never took the job.
        booking.total_amount = round_money(Decimal(booking.total_amount) - Decimal(assignment.agreed_amount))
        booking.driver_fee_amount = Decimal("0")
        booking.with_driver = False

    await db.commit()
    await db.refresh(assignment)

    await notification_service.notify(
        db,
        user_id=booking.customer_id,
        title="Driver confirmed" if accept else "Driver unavailable",
        message=(
            f"A driver accepted booking {booking.booking_number}."
            if accept
            else f"The driver declined booking {booking.booking_number}. Pick another driver."
        ),
        data={"bookingId": booking.id, "assignmentId": assignment.id},
    )
    return assignment


async def review_verification(
    db: AsyncSession, *, driver: Driver, status: DriverVerificationStatus, reason: str | None
) -> Driver:
    driver.verification_status = status
    driver.rejection_reason = reason if status is DriverVerificationStatus.REJECTED else None
    await db.commit()
    await db.refresh(driver)

    await notification_service.notify(
        db,
        user_id=driver.user_id,
        title=f"Driver profile {status.value.lower()}",
        message=(
            "Your driver profile is verified — you can now be hired."
            if status is DriverVerificationStatus.VERIFIED
            else f"Your driver profile is now {status.value.lower()}."
        ),
        data={"driverId": driver.id},
    )
    return driver


async def assert_is_driver(db: AsyncSession, user_id: str) -> None:
    user = await db.get(User, user_id)
    if user is None or user.user_type is not UserType.DRIVER:
        raise ApiError.forbidden()


async def stats(db: AsyncSession, driver_id: str) -> dict:
    completed = (
        await db.execute(
            select(func.count())
            .select_from(DriverAssignment)
            .where(
                DriverAssignment.driver_id == driver_id,
                DriverAssignment.status == DriverAssignmentStatus.COMPLETED,
            )
        )
    ).scalar_one()
    earned = (
        await db.execute(
            select(func.coalesce(func.sum(DriverAssignment.agreed_amount), 0)).where(
                DriverAssignment.driver_id == driver_id,
                DriverAssignment.status == DriverAssignmentStatus.COMPLETED,
            )
        )
    ).scalar_one()
    pending = (
        await db.execute(
            select(func.count())
            .select_from(DriverAssignment)
            .where(
                DriverAssignment.driver_id == driver_id,
                DriverAssignment.status == DriverAssignmentStatus.REQUESTED,
            )
        )
    ).scalar_one()
    return {"completedTrips": completed, "pendingRequests": pending, "totalEarned": str(round_money(Decimal(earned)))}
