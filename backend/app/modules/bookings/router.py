from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import BookingStatus, UserType
from app.db.models import Booking, RentalPartner, Vehicle
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.bookings import service
from app.modules.bookings.schemas import CancelBookingInput, CreateBookingInput, UpdateStatusInput

router = APIRouter(dependencies=[Depends(get_current_user)])

customer_only = Depends(require_user_type(UserType.CUSTOMER))
partner_only = Depends(require_user_type(UserType.RENTAL_PARTNER))


def _serialize_booking(
    booking: Booking,
    *,
    vehicle: str | None = None,
    rental_partner: bool = False,
    customer: bool = False,
    status_history: bool = False,
    payments: bool = False,
    invoice: bool = False,
    coupon: bool = False,
) -> dict:
    extra: dict = {}
    if vehicle == "flat":
        extra["vehicle"] = orm_to_dict(booking.vehicle) if booking.vehicle is not None else None
    elif vehicle == "images":
        extra["vehicle"] = (
            orm_to_dict(booking.vehicle, extra={"images": [orm_to_dict(i) for i in booking.vehicle.images]})
            if booking.vehicle is not None
            else None
        )
    if rental_partner:
        extra["rentalPartner"] = orm_to_dict(booking.rental_partner) if booking.rental_partner is not None else None
    if customer:
        extra["customer"] = sanitize_user(booking.customer) if booking.customer is not None else None
    if status_history:
        extra["statusHistory"] = [orm_to_dict(h) for h in sorted(booking.status_history, key=lambda h: h.created_at)]
    if payments:
        extra["payments"] = [orm_to_dict(p) for p in booking.payments]
    if invoice:
        extra["invoice"] = orm_to_dict(booking.invoice) if booking.invoice is not None else None
    if coupon:
        extra["coupon"] = orm_to_dict(booking.coupon) if booking.coupon is not None else None
    return orm_to_dict(booking, extra=extra)


@router.post("", dependencies=[customer_only], status_code=201)
async def create(payload: CreateBookingInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    booking = await service.create_booking(
        db,
        customer_id=user.id,
        vehicle_id=payload.vehicleId,
        driving_license_id=payload.drivingLicenseId,
        pickup_datetime=payload.pickupDatetime,
        return_datetime=payload.returnDatetime,
        pickup_location=payload.pickupLocation,
        return_location=payload.returnLocation,
        coupon_code=payload.couponCode,
        extra_driver_count=payload.extraDriverCount,
        is_young_driver=payload.isYoungDriver,
    )
    return success_response(orm_to_dict(booking), 201)


@router.get("/mine", dependencies=[customer_only])
async def list_my_bookings(
    status: BookingStatus | None = Query(default=None),
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    conditions = [Booking.customer_id == user.id]
    if status is not None:
        conditions.append(Booking.status == status)

    stmt = (
        select(Booking)
        .where(*conditions)
        .options(selectinload(Booking.vehicle).selectinload(Vehicle.images), selectinload(Booking.rental_partner))
        .order_by(Booking.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    bookings = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Booking).where(*conditions))).scalar_one()

    return success_response(
        [_serialize_booking(b, vehicle="images", rental_partner=True) for b in bookings],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.get("/{id}/cancellation-preview", dependencies=[customer_only])
async def cancellation_preview(id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    preview = await service.preview_cancellation(db, id, user.id)
    return success_response(preview)


@router.post("/{id}/cancel", dependencies=[customer_only])
async def cancel(
    id: UuidPath, payload: CancelBookingInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    booking = await db.get(Booking, id)
    if booking is None:
        raise ApiError.not_found("Booking not found")
    if booking.customer_id != user.id:
        raise ApiError.forbidden()

    updated = await service.cancel_booking(db, booking.id, user.id, payload.reason)
    return success_response(orm_to_dict(updated))


@router.get("/partner/mine", dependencies=[partner_only])
async def list_partner_bookings(
    status: BookingStatus | None = Query(default=None),
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user.id))).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner profile not found")

    conditions = [Booking.rental_partner_id == partner.id]
    if status is not None:
        conditions.append(Booking.status == status)

    stmt = (
        select(Booking)
        .where(*conditions)
        .options(selectinload(Booking.vehicle), selectinload(Booking.customer))
        .order_by(Booking.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    bookings = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Booking).where(*conditions))).scalar_one()

    return success_response(
        [_serialize_booking(b, vehicle="flat", customer=True) for b in bookings],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.patch("/{id}/status", dependencies=[partner_only])
async def update_status(
    id: UuidPath, payload: UpdateStatusInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    stmt = select(Booking).where(Booking.id == id).options(selectinload(Booking.rental_partner))
    booking = (await db.execute(stmt)).scalar_one_or_none()
    if booking is None:
        raise ApiError.not_found("Booking not found")
    if booking.rental_partner.user_id != user.id:
        raise ApiError.forbidden()

    updated = await service.transition_status(
        db, booking.id, BookingStatus(payload.status), user.id, payload.note, actual_return_at=payload.actualReturnAt
    )
    return success_response(orm_to_dict(updated))


@router.get("/{id}")
async def get_by_id(id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Booking)
        .where(Booking.id == id)
        .options(
            selectinload(Booking.vehicle).selectinload(Vehicle.images),
            selectinload(Booking.rental_partner),
            selectinload(Booking.customer),
            selectinload(Booking.status_history),
            selectinload(Booking.payments),
            selectinload(Booking.invoice),
            selectinload(Booking.coupon),
        )
    )
    booking = (await db.execute(stmt)).scalar_one_or_none()
    if booking is None:
        raise ApiError.not_found("Booking not found")

    is_owner = booking.customer_id == user.id
    is_partner = user.user_type == UserType.RENTAL_PARTNER
    is_admin = user.user_type in (UserType.ADMIN, UserType.SUPER_ADMIN)
    if not (is_owner or is_partner or is_admin):
        raise ApiError.forbidden()

    return success_response(
        _serialize_booking(
            booking,
            vehicle="images",
            rental_partner=True,
            customer=True,
            status_history=True,
            payments=True,
            invoice=True,
            coupon=True,
        )
    )
