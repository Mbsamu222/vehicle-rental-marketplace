from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.money import round_money
from app.core.datetimes import ensure_aware
from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import BookingStatus, DocumentStatus, MonetizationFeatureKey, PartnerVerificationStatus, UserType
from app.db.models import BankDetail, Booking, BusinessDocument, RentalPartner, Vehicle
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.monetization import service as monetization_service
from app.modules.rental_partners.schemas import (
    CreatePartnerProfileInput,
    ReviewDocumentInput,
    SetBankDetailsInput,
    UpdatePartnerProfileInput,
    UpdateVerificationStatusInput,
    UploadDocumentInput,
)
from app.modules.subscriptions.service import get_active_subscription

router = APIRouter()

partner_only = Depends(require_user_type(UserType.RENTAL_PARTNER))
admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))

PARTNER_ACTIVE_BOOKING_STATUSES = (
    BookingStatus.APPROVED,
    BookingStatus.VEHICLE_READY,
    BookingStatus.PICKED_UP,
    BookingStatus.ACTIVE,
    BookingStatus.RETURNING,
)


async def _get_owned_partner_or_throw(db: AsyncSession, user_id: str) -> RentalPartner:
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user_id))).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner profile not found. Complete onboarding first.")
    return partner


# ─── Partner self-service ───


@router.post("/me", dependencies=[partner_only], status_code=201)
async def create_profile(
    payload: CreatePartnerProfileInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    existing = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user.id))).scalar_one_or_none()
    if existing is not None:
        raise ApiError.conflict("Rental partner profile already exists")

    partner = RentalPartner(
        user_id=user.id,
        business_name=payload.businessName,
        business_email=payload.businessEmail,
        business_phone=payload.businessPhone,
        city_id=payload.cityId,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        logo_url=payload.logoUrl,
        description=payload.description,
    )
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    return success_response(orm_to_dict(partner), 201)


@router.get("/me", dependencies=[partner_only])
async def get_my_profile(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(RentalPartner)
        .where(RentalPartner.user_id == user.id)
        .options(
            selectinload(RentalPartner.documents),
            selectinload(RentalPartner.bank_details),
            selectinload(RentalPartner.city),
        )
    )
    partner = (await db.execute(stmt)).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner profile not found")
    return success_response(_serialize_partner(partner, documents=True, bank_details=True, city=True))


@router.patch("/me", dependencies=[partner_only])
async def update_my_profile(
    payload: UpdatePartnerProfileInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    partner = await _get_owned_partner_or_throw(db, user.id)
    field_map = {"cityId": "city_id", "logoUrl": "logo_url"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(partner, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(partner)
    return success_response(orm_to_dict(partner))


@router.get("/me/dashboard", dependencies=[partner_only])
async def get_dashboard(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    partner = await _get_owned_partner_or_throw(db, user.id)

    total_vehicles = (
        await db.execute(select(func.count()).select_from(Vehicle).where(Vehicle.rental_partner_id == partner.id))
    ).scalar_one()
    active_bookings = (
        await db.execute(
            select(func.count())
            .select_from(Booking)
            .where(Booking.rental_partner_id == partner.id, Booking.status.in_(PARTNER_ACTIVE_BOOKING_STATUSES))
        )
    ).scalar_one()
    pending_requests = (
        await db.execute(
            select(func.count())
            .select_from(Booking)
            .where(Booking.rental_partner_id == partner.id, Booking.status == BookingStatus.PENDING)
        )
    ).scalar_one()
    completed_bookings = (
        await db.execute(
            select(func.count())
            .select_from(Booking)
            .where(Booking.rental_partner_id == partner.id, Booking.status == BookingStatus.COMPLETED)
        )
    ).scalar_one()
    total_revenue = (
        await db.execute(
            select(func.sum(Booking.total_amount)).where(
                Booking.rental_partner_id == partner.id, Booking.status == BookingStatus.COMPLETED
            )
        )
    ).scalar_one()

    return success_response(
        {
            "totalVehicles": total_vehicles,
            "activeBookings": active_bookings,
            "pendingRequests": pending_requests,
            "completedBookings": completed_bookings,
            "totalRevenue": total_revenue if total_revenue is not None else 0,
            "averageRating": partner.average_rating,
            "verificationStatus": partner.verification_status,
        }
    )






@router.get("/me/analytics", dependencies=[partner_only])
async def get_analytics(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    partner = await _get_owned_partner_or_throw(db, user.id)

    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.FLEET_ANALYTICS):
        raise ApiError.forbidden("Fleet analytics is not currently enabled")

    subscription = await get_active_subscription(db, partner.id)
    has_analytics_access = (
        subscription is not None and bool(subscription.plan.features) and subscription.plan.features.get("analytics") is True
    )
    if not has_analytics_access:
        raise ApiError.forbidden("Upgrade your subscription plan to access fleet analytics")

    vehicles_stmt = (
        select(Vehicle)
        .where(Vehicle.rental_partner_id == partner.id, Vehicle.is_active.is_(True))
        .options(selectinload(Vehicle.category))
    )
    vehicles = (await db.execute(vehicles_stmt)).scalars().all()
    vehicles_by_id = {v.id: v for v in vehicles}
    vehicle_count = len(vehicles)

    bookings_stmt = select(Booking).where(
        Booking.rental_partner_id == partner.id, Booking.status != BookingStatus.CANCELLED
    )
    bookings = (await db.execute(bookings_stmt)).scalars().all()

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_bookings = [b for b in bookings if ensure_aware(b.pickup_datetime) >= thirty_days_ago]
    booked_days = sum(
        max(0.0, (ensure_aware(b.return_datetime) - ensure_aware(b.pickup_datetime)).total_seconds() / 86400)
        for b in recent_bookings
    )
    utilization_percent = (
        round_money(Decimal(str(booked_days)) / Decimal(vehicle_count * 30) * 100) if vehicle_count > 0 else Decimal("0")
    )

    completed = [b for b in bookings if b.status == BookingStatus.COMPLETED]
    total_completed_revenue = sum((b.total_amount for b in completed), Decimal("0"))
    average_revenue_per_vehicle = round_money(total_completed_revenue / vehicle_count) if vehicle_count > 0 else Decimal("0")

    revenue_by_vehicle: dict[str, Decimal] = {}
    bookings_by_vehicle: dict[str, int] = {}
    for b in completed:
        revenue_by_vehicle[b.vehicle_id] = revenue_by_vehicle.get(b.vehicle_id, Decimal("0")) + b.total_amount
        bookings_by_vehicle[b.vehicle_id] = bookings_by_vehicle.get(b.vehicle_id, 0) + 1

    top_vehicles = [
        {
            "vehicleId": vehicle_id,
            "model": vehicles_by_id[vehicle_id].model if vehicle_id in vehicles_by_id else "Unknown",
            "totalRevenue": revenue,
            "totalBookings": bookings_by_vehicle.get(vehicle_id, 0),
        }
        for vehicle_id, revenue in sorted(revenue_by_vehicle.items(), key=lambda kv: kv[1], reverse=True)[:5]
    ]

    category_counts: dict[str, int] = {}
    for b in recent_bookings:
        vehicle = vehicles_by_id.get(b.vehicle_id)
        if vehicle is None or vehicle.category is None:
            continue
        category_counts[vehicle.category.name] = category_counts.get(vehicle.category.name, 0) + 1
    category_demand = [
        {"categoryName": name, "bookingCount": count}
        for name, count in sorted(category_counts.items(), key=lambda kv: kv[1], reverse=True)
    ]

    return success_response(
        {
            "vehicleCount": vehicle_count,
            "utilizationPercent": utilization_percent,
            "averageRevenuePerVehicle": average_revenue_per_vehicle,
            "topVehicles": top_vehicles,
            "categoryDemand": category_demand,
        }
    )


@router.post("/me/documents", dependencies=[partner_only], status_code=201)
async def upload_document(
    payload: UploadDocumentInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    partner = await _get_owned_partner_or_throw(db, user.id)
    document = BusinessDocument(rental_partner_id=partner.id, type=payload.type, file_url=payload.fileUrl)
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return success_response(orm_to_dict(document), 201)


@router.put("/me/bank-details", dependencies=[partner_only])
async def set_bank_details(
    payload: SetBankDetailsInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    partner = await _get_owned_partner_or_throw(db, user.id)
    bank_details = (
        await db.execute(select(BankDetail).where(BankDetail.rental_partner_id == partner.id))
    ).scalar_one_or_none()

    if bank_details is None:
        bank_details = BankDetail(
            rental_partner_id=partner.id,
            account_holder=payload.accountHolder,
            account_number=payload.accountNumber,
            ifsc_code=payload.ifscCode,
            bank_name=payload.bankName,
            branch=payload.branch,
            upi_id=payload.upiId,
        )
        db.add(bank_details)
    else:
        bank_details.account_holder = payload.accountHolder
        bank_details.account_number = payload.accountNumber
        bank_details.ifsc_code = payload.ifscCode
        bank_details.bank_name = payload.bankName
        bank_details.branch = payload.branch
        bank_details.upi_id = payload.upiId

    await db.commit()
    await db.refresh(bank_details)
    return success_response(orm_to_dict(bank_details))


# ─── Admin oversight ───


@router.get("", dependencies=[admin_only, Depends(require_permission("partners.view"))])
async def list_partners(
    status: PartnerVerificationStatus | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RentalPartner).options(selectinload(RentalPartner.city))
    count_stmt = select(func.count()).select_from(RentalPartner)
    if status is not None:
        stmt = stmt.where(RentalPartner.verification_status == status)
        count_stmt = count_stmt.where(RentalPartner.verification_status == status)

    stmt = stmt.order_by(RentalPartner.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    partners = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(count_stmt)).scalar_one()

    return success_response(
        [_serialize_partner(p, city=True) for p in partners],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.get("/{id}", dependencies=[admin_only, Depends(require_permission("partners.view"))])
async def get_partner_by_id(id: UuidPath, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(RentalPartner)
        .where(RentalPartner.id == id)
        .options(
            selectinload(RentalPartner.documents),
            selectinload(RentalPartner.bank_details),
            selectinload(RentalPartner.city),
            selectinload(RentalPartner.user),
        )
    )
    partner = (await db.execute(stmt)).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner not found")

    return success_response(
        _serialize_partner(
            partner,
            documents=True,
            bank_details=True,
            city=True,
            extra={"user": sanitize_user(partner.user)},
        )
    )


@router.patch("/{id}/verification-status", dependencies=[admin_only, Depends(require_permission("partners.verify"))])
async def update_verification_status(
    id: UuidPath, payload: UpdateVerificationStatusInput, db: AsyncSession = Depends(get_db)
):
    partner = await db.get(RentalPartner, id)
    if partner is None:
        raise ApiError.not_found("Rental partner not found")
    partner.verification_status = PartnerVerificationStatus(payload.status)
    await db.commit()
    await db.refresh(partner)
    return success_response(orm_to_dict(partner))


@router.patch("/documents/{documentId}/review", dependencies=[admin_only, Depends(require_permission("partners.verify"))])
async def review_document(documentId: UuidPath, payload: ReviewDocumentInput, db: AsyncSession = Depends(get_db)):
    document = await db.get(BusinessDocument, documentId)
    if document is None:
        raise ApiError.not_found("Document not found")
    document.status = DocumentStatus(payload.status)
    document.rejection_reason = payload.rejectionReason
    document.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(document)
    return success_response(orm_to_dict(document))


def _serialize_partner(
    partner: RentalPartner,
    *,
    documents: bool = False,
    bank_details: bool = False,
    city: bool = False,
    extra: dict | None = None,
) -> dict:
    nested: dict = {}
    if documents:
        nested["documents"] = [orm_to_dict(d) for d in partner.documents]
    if bank_details:
        nested["bankDetails"] = orm_to_dict(partner.bank_details) if partner.bank_details is not None else None
    if city:
        nested["city"] = orm_to_dict(partner.city) if partner.city is not None else None
    if extra:
        nested.update(extra)
    return orm_to_dict(partner, extra=nested)
