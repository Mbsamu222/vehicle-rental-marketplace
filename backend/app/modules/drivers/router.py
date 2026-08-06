from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.responses import ApiError, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import DriverVerificationStatus, UserType
from app.db.models import Booking, Driver, DriverAssignment, DriverDocument
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.drivers import service
from app.modules.drivers.schemas import (
    CreateDriverProfileInput,
    RequestDriverInput,
    RespondAssignmentInput,
    ReviewDriverInput,
    UpdateDriverProfileInput,
    UploadDriverDocumentInput,
)

router = APIRouter(dependencies=[Depends(get_current_user)])

driver_only = Depends(require_user_type(UserType.DRIVER))
customer_only = Depends(require_user_type(UserType.CUSTOMER))
admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))


def _serialize(driver: Driver, *, user: bool = False, documents: bool = False) -> dict:
    extra: dict = {}
    if user and driver.user is not None:
        extra["user"] = sanitize_user(driver.user)
    if documents:
        extra["documents"] = [orm_to_dict(d) for d in driver.documents]
    if driver.city is not None:
        extra["city"] = orm_to_dict(driver.city)
    return orm_to_dict(driver, extra=extra)


# ── Driver's own profile ─────────────────────────────────────────────────


@router.post("/me", dependencies=[driver_only], status_code=201)
async def create_profile(
    payload: CreateDriverProfileInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    driver = await service.create_profile(db, user.id, payload.model_dump())
    return success_response(orm_to_dict(driver), 201)


@router.get("/me", dependencies=[driver_only])
async def my_profile(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    driver = await service.get_by_user(db, user.id)
    loaded = (
        await db.execute(
            select(Driver)
            .where(Driver.id == driver.id)
            .options(selectinload(Driver.documents), selectinload(Driver.city))
        )
    ).scalar_one()
    return success_response(_serialize(loaded, documents=True))


@router.patch("/me", dependencies=[driver_only])
async def update_profile(
    payload: UpdateDriverProfileInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    driver = await service.get_by_user(db, user.id)
    data = payload.model_dump(exclude_none=True)
    mapping = {
        "dailyRate": "daily_rate",
        "hourlyRate": "hourly_rate",
        "bio": "bio",
        "photoUrl": "photo_url",
        "languages": "languages",
        "isAvailable": "is_available",
    }
    for key, value in data.items():
        setattr(driver, mapping[key], value)
    await db.commit()
    await db.refresh(driver)
    return success_response(orm_to_dict(driver))


@router.get("/me/stats", dependencies=[driver_only])
async def my_stats(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    driver = await service.get_by_user(db, user.id)
    return success_response(await service.stats(db, driver.id))


@router.post("/me/documents", dependencies=[driver_only], status_code=201)
async def upload_document(
    payload: UploadDriverDocumentInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    driver = await service.get_by_user(db, user.id)
    doc = DriverDocument(driver_id=driver.id, type=payload.type, file_url=payload.fileUrl)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return success_response(orm_to_dict(doc), 201)


@router.get("/me/assignments", dependencies=[driver_only])
async def my_assignments(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    driver = await service.get_by_user(db, user.id)
    rows = (
        await db.execute(
            select(DriverAssignment)
            .where(DriverAssignment.driver_id == driver.id)
            .options(selectinload(DriverAssignment.booking))
            .order_by(DriverAssignment.created_at.desc())
        )
    ).scalars().all()
    return success_response(
        [
            orm_to_dict(a, extra={"booking": orm_to_dict(a.booking) if a.booking is not None else None})
            for a in rows
        ]
    )


@router.patch("/me/assignments/{id}", dependencies=[driver_only])
async def respond_to_assignment(
    id: UuidPath,
    payload: RespondAssignmentInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    driver = await service.get_by_user(db, user.id)
    assignment = (
        await db.execute(
            select(DriverAssignment).where(DriverAssignment.id == id, DriverAssignment.driver_id == driver.id)
        )
    ).scalar_one_or_none()
    if assignment is None:
        raise ApiError.not_found("Assignment not found")

    booking = await db.get(Booking, assignment.booking_id)
    if booking is None:
        raise ApiError.not_found("Booking not found")

    updated = await service.respond(
        db, assignment=assignment, booking=booking, accept=payload.accept, reason=payload.declineReason
    )
    return success_response(orm_to_dict(updated))


# ── Customer-facing discovery + hiring ───────────────────────────────────


@router.get("/available")
async def list_available(
    cityId: str = Query(...),
    pickup: datetime = Query(...),
    returnAt: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Verified drivers free for the whole window. Open to any signed-in user so
    a customer can compare drivers before committing to a booking."""
    drivers = await service.find_available(db, city_id=cityId, pickup=pickup, ret=returnAt)
    return success_response(
        [
            orm_to_dict(d, extra={"quotedAmount": str(service.price_driver(d, pickup, returnAt))})
            for d in drivers
        ]
    )


@router.post("/bookings/{id}/request", dependencies=[customer_only], status_code=201)
async def request_driver(
    id: UuidPath,
    payload: RequestDriverInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    booking = await db.get(Booking, id)
    if booking is None:
        raise ApiError.not_found("Booking not found")
    if booking.customer_id != user.id:
        raise ApiError.forbidden()

    assignment = await service.request_driver(db, booking=booking, driver_id=payload.driverId)
    return success_response(orm_to_dict(assignment), 201)


# ── Admin oversight ──────────────────────────────────────────────────────


@router.get("", dependencies=[admin_only, Depends(require_permission("drivers.verify"))])
async def list_drivers(status: str | None = Query(default=None), db: AsyncSession = Depends(get_db)):
    stmt = select(Driver).options(selectinload(Driver.user), selectinload(Driver.city))
    if status:
        stmt = stmt.where(Driver.verification_status == DriverVerificationStatus(status))
    rows = (await db.execute(stmt.order_by(Driver.created_at.desc()))).scalars().all()
    return success_response([_serialize(d, user=True) for d in rows])


@router.patch("/{id}/verification", dependencies=[admin_only, Depends(require_permission("drivers.verify"))])
async def review_driver(
    id: UuidPath, payload: ReviewDriverInput, db: AsyncSession = Depends(get_db)
):
    driver = await db.get(Driver, id)
    if driver is None:
        raise ApiError.not_found("Driver not found")

    updated = await service.review_verification(
        db,
        driver=driver,
        status=DriverVerificationStatus(payload.status),
        reason=payload.rejectionReason,
    )
    return success_response(orm_to_dict(updated))
