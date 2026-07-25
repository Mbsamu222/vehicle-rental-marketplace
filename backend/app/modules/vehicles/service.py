from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import BookingStatus
from app.db.models import Booking, VehicleAvailability

BLOCKING_BOOKING_STATUSES = (
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.APPROVED,
    BookingStatus.VEHICLE_READY,
    BookingStatus.PICKED_UP,
    BookingStatus.ACTIVE,
    BookingStatus.RETURNING,
)


async def find_unavailable_vehicle_ids(db: AsyncSession, pickup: datetime, ret: datetime) -> set[str]:
    """Vehicle IDs that have a conflicting booking or manual availability block in the given window."""
    booking_ids = (
        await db.execute(
            select(Booking.vehicle_id).where(
                Booking.status.in_(BLOCKING_BOOKING_STATUSES),
                Booking.pickup_datetime < ret,
                Booking.return_datetime > pickup,
            )
        )
    ).scalars().all()
    block_ids = (
        await db.execute(
            select(VehicleAvailability.vehicle_id).where(
                VehicleAvailability.start_date < ret, VehicleAvailability.end_date > pickup
            )
        )
    ).scalars().all()
    return set(booking_ids) | set(block_ids)


async def is_vehicle_available(db: AsyncSession, vehicle_id: str, pickup: datetime, ret: datetime) -> bool:
    unavailable = await find_unavailable_vehicle_ids(db, pickup, ret)
    return vehicle_id not in unavailable
