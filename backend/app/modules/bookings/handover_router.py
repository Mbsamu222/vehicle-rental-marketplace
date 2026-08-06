"""Endpoints for handover inspections, booking extensions, and traffic fines.

Mounted under the same `/bookings` prefix as `router.py` (see app/main.py) but
kept in its own module to mirror the service split.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.responses import ApiError, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import FuelLevel, InspectionType, TrafficFineStatus, UserType
from app.db.models import Booking, BookingExtension, BookingInspection, TrafficFine
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.bookings import handover_service as service
from app.modules.bookings.schemas import (
    CreateInspectionInput,
    CreateTrafficFineInput,
    DecideExtensionInput,
    RequestExtensionInput,
    UpdateTrafficFineStatusInput,
)

router = APIRouter(dependencies=[Depends(get_current_user)])

customer_only = Depends(require_user_type(UserType.CUSTOMER))
partner_only = Depends(require_user_type(UserType.RENTAL_PARTNER))
admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))


async def _load_booking(db: AsyncSession, booking_id: str) -> Booking:
    booking = (
        await db.execute(
            select(Booking).where(Booking.id == booking_id).options(selectinload(Booking.rental_partner))
        )
    ).scalar_one_or_none()
    if booking is None:
        raise ApiError.not_found("Booking not found")
    return booking


def _assert_partner_owns(booking: Booking, user: AuthUser) -> None:
    if booking.rental_partner is None or booking.rental_partner.user_id != user.id:
        raise ApiError.forbidden()


def _assert_can_read(booking: Booking, user: AuthUser) -> None:
    is_owner = booking.customer_id == user.id
    is_partner = booking.rental_partner is not None and booking.rental_partner.user_id == user.id
    is_admin = user.user_type in (UserType.ADMIN, UserType.SUPER_ADMIN)
    if not (is_owner or is_partner or is_admin):
        raise ApiError.forbidden()


def _serialize_inspection(inspection: BookingInspection) -> dict:
    return orm_to_dict(inspection, extra={"photos": [orm_to_dict(p) for p in inspection.photos]})


# ── Inspections ──────────────────────────────────────────────────────────


@router.post("/{id}/inspections", dependencies=[partner_only], status_code=201)
async def create_inspection(
    id: UuidPath,
    payload: CreateInspectionInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Records the pickup or return condition report. Partner-only: the partner
    is the one physically with the vehicle at handover."""
    booking = await _load_booking(db, id)
    _assert_partner_owns(booking, user)

    inspection = await service.record_inspection(
        db,
        booking=booking,
        inspection_type=InspectionType(payload.type),
        odometer_km=payload.odometerKm,
        fuel_level=FuelLevel(payload.fuelLevel),
        exterior_notes=payload.exteriorNotes,
        interior_notes=payload.interiorNotes,
        damage_notes=payload.damageNotes,
        customer_acknowledged=payload.customerAcknowledged,
        photos=[p.model_dump() for p in payload.photos],
        recorded_by_id=user.id,
    )
    # Re-read with photos so the response includes what was just attached.
    inspection = (
        await db.execute(
            select(BookingInspection)
            .where(BookingInspection.id == inspection.id)
            .options(selectinload(BookingInspection.photos))
        )
    ).scalar_one()
    return success_response(_serialize_inspection(inspection), 201)


@router.get("/{id}/inspections")
async def list_inspections(
    id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Both condition reports plus the derived distance travelled. Readable by
    the renter, the owning partner, and admins — the renter needs to see the
    evidence behind any deposit deduction."""
    booking = await _load_booking(db, id)
    _assert_can_read(booking, user)

    inspections = (
        (
            await db.execute(
                select(BookingInspection)
                .where(BookingInspection.booking_id == id)
                .options(selectinload(BookingInspection.photos))
                .order_by(BookingInspection.created_at)
            )
        )
        .scalars()
        .all()
    )
    return success_response(
        {
            "inspections": [_serialize_inspection(i) for i in inspections],
            "distanceTravelledKm": service.distance_travelled(list(inspections)),
        }
    )


# ── Extensions ───────────────────────────────────────────────────────────


@router.post("/{id}/extensions", dependencies=[customer_only], status_code=201)
async def request_extension(
    id: UuidPath,
    payload: RequestExtensionInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    booking = await _load_booking(db, id)
    if booking.customer_id != user.id:
        raise ApiError.forbidden()

    extension = await service.request_extension(
        db, booking=booking, requested_return=payload.requestedReturnDatetime
    )
    return success_response(orm_to_dict(extension), 201)


@router.get("/{id}/extensions")
async def list_extensions(
    id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    booking = await _load_booking(db, id)
    _assert_can_read(booking, user)

    extensions = (
        (
            await db.execute(
                select(BookingExtension)
                .where(BookingExtension.booking_id == id)
                .order_by(BookingExtension.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return success_response([orm_to_dict(e) for e in extensions])


@router.patch("/{booking_id}/extensions/{extension_id}", dependencies=[partner_only])
async def decide_extension(
    booking_id: UuidPath,
    extension_id: UuidPath,
    payload: DecideExtensionInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """The partner decides — it is their vehicle and their calendar."""
    booking = await _load_booking(db, booking_id)
    _assert_partner_owns(booking, user)

    extension = (
        await db.execute(
            select(BookingExtension).where(
                BookingExtension.id == extension_id, BookingExtension.booking_id == booking_id
            )
        )
    ).scalar_one_or_none()
    if extension is None:
        raise ApiError.not_found("Extension request not found")

    updated = await service.decide_extension(
        db,
        extension=extension,
        booking=booking,
        approve=payload.approve,
        rejection_reason=payload.rejectionReason,
        actor_id=user.id,
    )
    return success_response(orm_to_dict(updated))


# ── Traffic fines ────────────────────────────────────────────────────────


@router.post("/traffic-fines", dependencies=[admin_only, Depends(require_permission("bookings.manage"))], status_code=201)
async def create_traffic_fine(
    payload: CreateTrafficFineInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-recorded: challans arrive at the registered owner, and attributing
    one to a renter has financial consequences, so it is not partner-writable."""
    booking = await _load_booking(db, payload.bookingId)
    fine = await service.record_traffic_fine(
        db,
        booking=booking,
        violation_at=payload.violationAt,
        amount=Decimal(str(payload.amount)),
        challan_number=payload.challanNumber,
        description=payload.description,
        evidence_url=payload.evidenceUrl,
        recorded_by_id=user.id,
    )
    return success_response(orm_to_dict(fine), 201)


@router.get("/{id}/traffic-fines")
async def list_traffic_fines(
    id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    booking = await _load_booking(db, id)
    _assert_can_read(booking, user)

    fines = (
        (
            await db.execute(
                select(TrafficFine).where(TrafficFine.booking_id == id).order_by(TrafficFine.violation_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return success_response([orm_to_dict(f) for f in fines])


@router.patch(
    "/traffic-fines/{id}", dependencies=[admin_only, Depends(require_permission("bookings.manage"))]
)
async def update_traffic_fine(
    id: UuidPath,
    payload: UpdateTrafficFineStatusInput,
    db: AsyncSession = Depends(get_db),
):
    fine = await db.get(TrafficFine, id)
    if fine is None:
        raise ApiError.not_found("Traffic fine not found")

    updated = await service.update_traffic_fine_status(db, fine=fine, status=TrafficFineStatus(payload.status))
    return success_response(orm_to_dict(updated))
