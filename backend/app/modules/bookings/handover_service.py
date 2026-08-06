"""Handover inspections, booking extensions, and traffic fines.

Split out of `service.py` to keep that module focused on pricing and the core
status machine. These three concerns all hang off a booking after it has been
confirmed, and all reuse `service`'s pricing/time helpers rather than
re-deriving them.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.money import round_money
from app.core.datetimes import ensure_aware
from app.core.responses import ApiError
from app.db.enums import BookingStatus, ExtensionStatus, FuelLevel, InspectionType, TrafficFineStatus
from app.db.models import (
    Booking,
    BookingExtension,
    BookingInspection,
    BookingStatusHistory,
    InspectionPhoto,
    RentalPartner,
    TrafficFine,
    Vehicle,
)
from app.modules.notifications import service as notification_service
from app.modules.vehicles import service as vehicle_service

from .service import calculate_price, get_booking_fee_config

# ══════════════════════════════════════════════════════════════════════════
# HANDOVER INSPECTIONS
# ══════════════════════════════════════════════════════════════════════════

# A condition report only makes sense once the vehicle is actually changing
# hands, and a RETURN report only once the trip is winding up. Allowing either
# earlier would let a partner pre-fill evidence before the customer sees the car.
PICKUP_INSPECTION_STATUSES = (BookingStatus.VEHICLE_READY, BookingStatus.PICKED_UP, BookingStatus.ACTIVE)
RETURN_INSPECTION_STATUSES = (BookingStatus.ACTIVE, BookingStatus.RETURNING, BookingStatus.COMPLETED)


async def record_inspection(
    db: AsyncSession,
    *,
    booking: Booking,
    inspection_type: InspectionType,
    odometer_km: int,
    fuel_level: FuelLevel,
    exterior_notes: str | None,
    interior_notes: str | None,
    damage_notes: str | None,
    customer_acknowledged: bool,
    photos: list[dict],
    recorded_by_id: str,
) -> BookingInspection:
    allowed = PICKUP_INSPECTION_STATUSES if inspection_type is InspectionType.PICKUP else RETURN_INSPECTION_STATUSES
    if booking.status not in allowed:
        raise ApiError.bad_request(
            f"A {inspection_type.value} inspection cannot be recorded while the booking is {booking.status.value}"
        )

    existing = (
        await db.execute(
            select(BookingInspection).where(
                BookingInspection.booking_id == booking.id,
                BookingInspection.type == inspection_type,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        # Immutable by design: an amendable condition report is worthless as
        # evidence in a deposit dispute.
        raise ApiError.conflict(f"A {inspection_type.value} inspection already exists for this booking")

    if inspection_type is InspectionType.RETURN:
        pickup_report = (
            await db.execute(
                select(BookingInspection).where(
                    BookingInspection.booking_id == booking.id,
                    BookingInspection.type == InspectionType.PICKUP,
                )
            )
        ).scalar_one_or_none()
        if pickup_report is None:
            raise ApiError.bad_request("Record the pickup inspection before the return inspection")
        if odometer_km < pickup_report.odometer_km:
            raise ApiError.bad_request(
                f"Return odometer ({odometer_km} km) cannot be lower than at pickup ({pickup_report.odometer_km} km)"
            )

    inspection = BookingInspection(
        booking_id=booking.id,
        type=inspection_type,
        odometer_km=odometer_km,
        fuel_level=fuel_level,
        exterior_notes=exterior_notes,
        interior_notes=interior_notes,
        damage_notes=damage_notes,
        customer_acknowledged=customer_acknowledged,
        recorded_by_id=recorded_by_id,
    )
    db.add(inspection)
    await db.flush()

    for photo in photos:
        db.add(InspectionPhoto(inspection_id=inspection.id, url=photo["url"], label=photo.get("label")))

    await db.commit()
    await db.refresh(inspection)
    return inspection


def distance_travelled(inspections: list[BookingInspection]) -> int | None:
    """Kilometres between the pickup and return odometer readings, or None until
    both reports exist."""
    by_type = {i.type: i for i in inspections}
    pickup = by_type.get(InspectionType.PICKUP)
    ret = by_type.get(InspectionType.RETURN)
    if pickup is None or ret is None:
        return None
    return ret.odometer_km - pickup.odometer_km


# ══════════════════════════════════════════════════════════════════════════
# BOOKING EXTENSIONS
# ══════════════════════════════════════════════════════════════════════════

EXTENDABLE_STATUSES = (BookingStatus.PICKED_UP, BookingStatus.ACTIVE)


async def request_extension(db: AsyncSession, *, booking: Booking, requested_return: datetime) -> BookingExtension:
    if booking.status not in EXTENDABLE_STATUSES:
        raise ApiError.bad_request("Only a picked-up or active booking can be extended")

    previous_return = ensure_aware(booking.return_datetime)
    requested_return = ensure_aware(requested_return)
    if requested_return <= previous_return:
        raise ApiError.bad_request("The new return time must be later than the current one")

    pending = (
        await db.execute(
            select(BookingExtension).where(
                BookingExtension.booking_id == booking.id,
                BookingExtension.status == ExtensionStatus.PENDING,
            )
        )
    ).scalar_one_or_none()
    if pending is not None:
        raise ApiError.conflict("An extension request is already awaiting a decision")

    vehicle = await db.get(Vehicle, booking.vehicle_id)
    if vehicle is None:
        raise ApiError.not_found("Vehicle not found")

    # Someone else may already hold the vehicle for the extra window. Only the
    # gap is checked — this booking's own current window is legitimately
    # occupied by itself.
    conflicts = await vehicle_service.find_unavailable_vehicle_ids(db, previous_return, requested_return)
    if booking.vehicle_id in conflicts:
        raise ApiError.conflict("The vehicle is already booked or blocked for the requested period")

    # Price the additional window at the same rates. No coupon is re-applied and
    # no second deposit is taken — the original deposit still covers the vehicle.
    pricing = calculate_price(
        price_per_hour=vehicle.price_per_hour,
        price_per_day=vehicle.price_per_day,
        security_deposit=Decimal("0"),
        pickup=previous_return,
        ret=requested_return,
        fee_config=await get_booking_fee_config(db),
    )

    extension = BookingExtension(
        booking_id=booking.id,
        requested_return_datetime=requested_return,
        previous_return_datetime=previous_return,
        additional_amount=pricing["total_amount"],
        status=ExtensionStatus.PENDING,
    )
    db.add(extension)
    await db.commit()
    await db.refresh(extension)

    partner_user_id = (
        await db.execute(select(RentalPartner.user_id).where(RentalPartner.id == booking.rental_partner_id))
    ).scalar_one_or_none()

    await notification_service.notify(
        db,
        user_id=partner_user_id or booking.customer_id,
        title="Extension requested",
        message=(
            f"A renter asked to keep booking {booking.booking_number} until "
            f"{requested_return.isoformat()}."
        ),
        data={"bookingId": booking.id, "extensionId": extension.id},
    )
    return extension


async def decide_extension(
    db: AsyncSession,
    *,
    extension: BookingExtension,
    booking: Booking,
    approve: bool,
    rejection_reason: str | None,
    actor_id: str,
) -> BookingExtension:
    if extension.status is not ExtensionStatus.PENDING:
        raise ApiError.bad_request(f"This request has already been {extension.status.value.lower()}")

    if approve:
        # Re-check at decision time: the window may have been taken between the
        # request and the approval.
        conflicts = await vehicle_service.find_unavailable_vehicle_ids(
            db,
            ensure_aware(extension.previous_return_datetime),
            ensure_aware(extension.requested_return_datetime),
        )
        if booking.vehicle_id in conflicts:
            raise ApiError.conflict("The vehicle is no longer free for the requested period")

        extension.status = ExtensionStatus.APPROVED
        booking.return_datetime = extension.requested_return_datetime
        booking.total_amount = round_money(Decimal(booking.total_amount) + Decimal(extension.additional_amount))
        db.add(
            BookingStatusHistory(
                booking_id=booking.id,
                status=booking.status,
                note=f"Return extended to {extension.requested_return_datetime.isoformat()}",
                changed_by_id=actor_id,
            )
        )
    else:
        extension.status = ExtensionStatus.REJECTED
        extension.rejection_reason = rejection_reason

    extension.decided_by_id = actor_id
    extension.decided_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(extension)

    await notification_service.notify(
        db,
        user_id=booking.customer_id,
        title="Extension approved" if approve else "Extension declined",
        message=(
            f"Booking {booking.booking_number} now returns "
            f"{extension.requested_return_datetime.isoformat()}."
            if approve
            else f"Your extension request for {booking.booking_number} was declined."
        ),
        data={"bookingId": booking.id, "extensionId": extension.id},
    )
    return extension


# ══════════════════════════════════════════════════════════════════════════
# TRAFFIC FINES
# ══════════════════════════════════════════════════════════════════════════


async def record_traffic_fine(
    db: AsyncSession,
    *,
    booking: Booking,
    violation_at: datetime,
    amount: Decimal,
    challan_number: str | None,
    description: str | None,
    evidence_url: str | None,
    recorded_by_id: str,
) -> TrafficFine:
    # A fine is only attributable to a renter if the violation happened while
    # they actually held the vehicle. `actual_return_at` takes precedence over
    # the scheduled return, because a late return extends their liability.
    started = ensure_aware(booking.pickup_datetime)
    ended = ensure_aware(booking.actual_return_at or booking.return_datetime)
    violation_at = ensure_aware(violation_at)
    if not (started <= violation_at <= ended):
        raise ApiError.bad_request(
            "The violation time falls outside this booking's rental period "
            f"({started.isoformat()} to {ended.isoformat()})"
        )

    fine = TrafficFine(
        booking_id=booking.id,
        challan_number=challan_number,
        violation_at=violation_at,
        amount=amount,
        description=description,
        evidence_url=evidence_url,
        recorded_by_id=recorded_by_id,
        status=TrafficFineStatus.PENDING,
    )
    db.add(fine)
    await db.commit()
    await db.refresh(fine)

    await notification_service.notify(
        db,
        user_id=booking.customer_id,
        title="A traffic fine was recorded for your rental",
        message=(
            f"A challan of {amount} was logged against booking {booking.booking_number}. "
            "Open the booking to review the details."
        ),
        data={"bookingId": booking.id, "trafficFineId": fine.id},
    )
    return fine


async def update_traffic_fine_status(
    db: AsyncSession, *, fine: TrafficFine, status: TrafficFineStatus
) -> TrafficFine:
    fine.status = status
    await db.commit()
    await db.refresh(fine)
    return fine
