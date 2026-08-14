from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import ColumnElement

from app.db.enums import BookingStatus
from app.db.models import Booking, Vehicle, VehicleAvailability

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


EARTH_RADIUS_KM = 6371.0


def haversine_km_expr(latitude: float, longitude: float) -> ColumnElement:
    """SQL expression for great-circle distance (km) from (latitude, longitude) to each row's
    Vehicle.latitude/longitude. Uses the asin/sqrt haversine form rather than the acos form to
    avoid an acos(1) NaN edge case when a vehicle sits exactly at the query point."""
    lat1 = func.radians(latitude)
    lat2 = func.radians(Vehicle.latitude)
    dlat = lat2 - lat1
    dlng = func.radians(Vehicle.longitude) - func.radians(longitude)
    a = func.pow(func.sin(dlat / 2), 2) + func.cos(lat1) * func.cos(lat2) * func.pow(func.sin(dlng / 2), 2)
    return EARTH_RADIUS_KM * 2 * func.asin(func.sqrt(a))
