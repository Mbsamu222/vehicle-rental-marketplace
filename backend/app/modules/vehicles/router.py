from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import MonetizationFeatureKey, PartnerVerificationStatus, UserType, VehicleApprovalStatus
from app.db.models import RentalPartner, Review, Vehicle, VehicleAvailability, VehicleBoost, VehicleImage
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user, get_optional_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.monetization import service as monetization_service
from app.modules.subscriptions.service import get_active_subscription
from app.modules.vehicles.schemas import (
    AddImagesInput,
    ApproveVehicleInput,
    BlockAvailabilityInput,
    BoostVehicleInput,
    CreateVehicleInput,
    FuelType,
    Transmission,
    UpdateVehicleInput,
)
from app.modules.vehicles.service import find_unavailable_vehicle_ids

router = APIRouter()

partner_only = Depends(require_user_type(UserType.RENTAL_PARTNER))
admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))

_VEHICLE_FIELD_MAP = {
    "categoryId": "category_id",
    "brandId": "brand_id",
    "cityId": "city_id",
    "registrationNumber": "registration_number",
    "fuelType": "fuel_type",
    "seatingCapacity": "seating_capacity",
    "pricePerHour": "price_per_hour",
    "pricePerDay": "price_per_day",
    "securityDeposit": "security_deposit",
    "insuranceDetails": "insurance_details",
    "rentalPolicies": "rental_policies",
}


def _serialize_vehicle(
    vehicle: Vehicle,
    *,
    images: bool = False,
    brand: bool = False,
    category: bool = False,
    city: bool = False,
    rental_partner: bool = False,
    reviews: bool = False,
    availability: bool = False,
) -> dict:
    extra: dict = {}
    if images:
        extra["images"] = [orm_to_dict(i) for i in sorted(vehicle.images, key=lambda i: i.sort_order)]
    if brand:
        extra["brand"] = orm_to_dict(vehicle.brand) if vehicle.brand is not None else None
    if category:
        extra["category"] = orm_to_dict(vehicle.category) if vehicle.category is not None else None
    if city:
        extra["city"] = orm_to_dict(vehicle.city) if vehicle.city is not None else None
    if rental_partner:
        extra["rentalPartner"] = orm_to_dict(vehicle.rental_partner) if vehicle.rental_partner is not None else None
    if reviews:
        top = sorted(vehicle.reviews, key=lambda r: r.created_at, reverse=True)[:10]
        extra["reviews"] = [
            orm_to_dict(
                r,
                extra={
                    "customer": sanitize_user(r.customer) if r.customer is not None else None,
                    "images": [orm_to_dict(i) for i in r.images],
                },
            )
            for r in top
        ]
    if availability:
        extra["availability"] = [orm_to_dict(a) for a in vehicle.availability]
    return orm_to_dict(vehicle, extra=extra)


async def _get_owned_vehicle_or_throw(db: AsyncSession, vehicle_id: str, user_id: str) -> Vehicle:
    stmt = select(Vehicle).where(Vehicle.id == vehicle_id).options(selectinload(Vehicle.rental_partner))
    vehicle = (await db.execute(stmt)).scalar_one_or_none()
    if vehicle is None:
        raise ApiError.not_found("Vehicle not found")
    if vehicle.rental_partner.user_id != user_id:
        raise ApiError.forbidden("You do not own this vehicle")
    return vehicle


# ─── Public ───


@router.get("/search")
async def search(
    cityId: str | None = Query(default=None),
    categoryId: str | None = Query(default=None),
    brandId: str | None = Query(default=None),
    transmission: Transmission | None = Query(default=None),
    fuelType: FuelType | None = Query(default=None),
    minPrice: float | None = Query(default=None),
    maxPrice: float | None = Query(default=None),
    seatingCapacity: int | None = Query(default=None),
    pickupDatetime: datetime | None = Query(default=None),
    returnDatetime: datetime | None = Query(default=None),
    sortBy: str | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
    _user: AuthUser | None = Depends(get_optional_user),
):
    conditions = [Vehicle.is_active.is_(True), Vehicle.approval_status == VehicleApprovalStatus.APPROVED]
    if cityId:
        conditions.append(Vehicle.city_id == cityId)
    if categoryId:
        conditions.append(Vehicle.category_id == categoryId)
    if brandId:
        conditions.append(Vehicle.brand_id == brandId)
    if transmission:
        conditions.append(Vehicle.transmission == transmission)
    if fuelType:
        conditions.append(Vehicle.fuel_type == fuelType)
    if seatingCapacity:
        conditions.append(Vehicle.seating_capacity >= seatingCapacity)
    if minPrice is not None:
        conditions.append(Vehicle.price_per_day >= minPrice)
    if maxPrice is not None:
        conditions.append(Vehicle.price_per_day <= maxPrice)

    if pickupDatetime and returnDatetime:
        unavailable = await find_unavailable_vehicle_ids(db, pickupDatetime, returnDatetime)
        if unavailable:
            conditions.append(Vehicle.id.not_in(unavailable))

    order = {
        "price_asc": Vehicle.price_per_day.asc(),
        "price_desc": Vehicle.price_per_day.desc(),
        "rating": Vehicle.average_rating.desc(),
    }.get(sortBy, Vehicle.created_at.desc())

    order_by = [order]
    if await monetization_service.is_enabled(db, MonetizationFeatureKey.BOOSTED_LISTINGS):
        is_currently_featured = and_(Vehicle.is_featured.is_(True), Vehicle.featured_until > datetime.now(timezone.utc))
        order_by.insert(0, desc(is_currently_featured))

    stmt = (
        select(Vehicle)
        .where(*conditions)
        .options(
            selectinload(Vehicle.images),
            selectinload(Vehicle.brand),
            selectinload(Vehicle.category),
            selectinload(Vehicle.city),
            selectinload(Vehicle.rental_partner),
        )
        .order_by(*order_by)
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    vehicles = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Vehicle).where(*conditions))).scalar_one()

    return success_response(
        [_serialize_vehicle(v, images=True, brand=True, category=True, city=True, rental_partner=True) for v in vehicles],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.get("/{id}")
async def get_by_id(id: UuidPath, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Vehicle)
        .where(Vehicle.id == id)
        .options(
            selectinload(Vehicle.images),
            selectinload(Vehicle.brand),
            selectinload(Vehicle.category),
            selectinload(Vehicle.city),
            selectinload(Vehicle.rental_partner),
            selectinload(Vehicle.reviews).selectinload(Review.customer),
            selectinload(Vehicle.reviews).selectinload(Review.images),
            selectinload(Vehicle.availability),
        )
    )
    vehicle = (await db.execute(stmt)).scalar_one_or_none()
    if vehicle is None:
        raise ApiError.not_found("Vehicle not found")
    return success_response(
        _serialize_vehicle(
            vehicle, images=True, brand=True, category=True, city=True, rental_partner=True, reviews=True, availability=True
        )
    )


@router.get("/{id}/availability")
async def check_availability(
    id: UuidPath,
    pickupDatetime: datetime = Query(...),
    returnDatetime: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    unavailable = await find_unavailable_vehicle_ids(db, pickupDatetime, returnDatetime)
    return success_response({"available": id not in unavailable})


# ─── Rental partner self-service ───


@router.get("/partner/mine", dependencies=[partner_only])
async def list_my_vehicles(
    user: AuthUser = Depends(get_current_user),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user.id))).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner profile not found")

    stmt = (
        select(Vehicle)
        .where(Vehicle.rental_partner_id == partner.id)
        .options(selectinload(Vehicle.images), selectinload(Vehicle.category), selectinload(Vehicle.brand))
        .order_by(Vehicle.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    vehicles = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(select(func.count()).select_from(Vehicle).where(Vehicle.rental_partner_id == partner.id))
    ).scalar_one()

    return success_response(
        [_serialize_vehicle(v, images=True, category=True, brand=True) for v in vehicles],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.post("", dependencies=[partner_only], status_code=201)
async def create_vehicle(
    payload: CreateVehicleInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user.id))).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Complete your rental partner profile first")
    if partner.verification_status != PartnerVerificationStatus.VERIFIED:
        raise ApiError.forbidden("Your business must be verified before listing vehicles")

    if await monetization_service.is_enabled(db, MonetizationFeatureKey.PARTNER_SUBSCRIPTIONS):
        subscription = await get_active_subscription(db, partner.id)
        if subscription is not None and subscription.plan.max_vehicles is not None:
            current_count = (
                await db.execute(
                    select(func.count()).select_from(Vehicle).where(
                        Vehicle.rental_partner_id == partner.id, Vehicle.is_active.is_(True)
                    )
                )
            ).scalar_one()
            if current_count >= subscription.plan.max_vehicles:
                raise ApiError.bad_request(
                    f"Your subscription plan allows up to {subscription.plan.max_vehicles} vehicles. "
                    "Upgrade your plan to list more."
                )

    data = payload.model_dump()
    vehicle = Vehicle(rental_partner_id=partner.id, **{_VEHICLE_FIELD_MAP.get(k, k): v for k, v in data.items()})
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return success_response(orm_to_dict(vehicle), 201)


@router.patch("/{id}", dependencies=[partner_only])
async def update_vehicle(
    id: UuidPath, payload: UpdateVehicleInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    vehicle = await _get_owned_vehicle_or_throw(db, id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, _VEHICLE_FIELD_MAP.get(field, field), value)
    vehicle.approval_status = VehicleApprovalStatus.PENDING  # edits require re-approval
    await db.commit()
    await db.refresh(vehicle)
    return success_response(orm_to_dict(vehicle))


@router.delete("/{id}", dependencies=[partner_only])
async def delete_vehicle(id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    vehicle = await _get_owned_vehicle_or_throw(db, id, user.id)
    vehicle.is_active = False
    await db.commit()
    return success_response({"message": "Vehicle deactivated"})


@router.post("/{id}/images", dependencies=[partner_only], status_code=201)
async def add_images(
    id: UuidPath, payload: AddImagesInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    vehicle = await _get_owned_vehicle_or_throw(db, id, user.id)
    created = [
        VehicleImage(vehicle_id=vehicle.id, url=img.url, is_primary=img.isPrimary or False, sort_order=img.sortOrder or 0)
        for img in payload.images
    ]
    db.add_all(created)
    await db.commit()
    for image in created:
        await db.refresh(image)
    return success_response([orm_to_dict(i) for i in created], 201)


@router.delete("/{id}/images/{imageId}", dependencies=[partner_only])
async def delete_image(
    id: UuidPath, imageId: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    vehicle = await _get_owned_vehicle_or_throw(db, id, user.id)
    image = await db.get(VehicleImage, imageId)
    if image is not None and image.vehicle_id == vehicle.id:
        await db.delete(image)
        await db.commit()
    return success_response({"message": "Image removed"})


@router.post("/{id}/availability-block", dependencies=[partner_only], status_code=201)
async def block_availability(
    id: UuidPath,
    payload: BlockAvailabilityInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await _get_owned_vehicle_or_throw(db, id, user.id)
    block = VehicleAvailability(
        vehicle_id=vehicle.id, start_date=payload.startDate, end_date=payload.endDate, reason=payload.reason
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return success_response(orm_to_dict(block), 201)


# ─── Admin ───


@router.get("/admin/pending-approval", dependencies=[admin_only, Depends(require_permission("vehicles.approve"))])
async def list_pending_approval(pagination: Pagination = Depends(get_pagination()), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Vehicle)
        .where(Vehicle.approval_status == VehicleApprovalStatus.PENDING)
        .options(selectinload(Vehicle.rental_partner), selectinload(Vehicle.images))
        .order_by(Vehicle.created_at.asc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    vehicles = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(
            select(func.count()).select_from(Vehicle).where(Vehicle.approval_status == VehicleApprovalStatus.PENDING)
        )
    ).scalar_one()

    return success_response(
        [_serialize_vehicle(v, rental_partner=True, images=True) for v in vehicles],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.patch("/{id}/review", dependencies=[admin_only, Depends(require_permission("vehicles.approve"))])
async def review_vehicle(id: UuidPath, payload: ApproveVehicleInput, db: AsyncSession = Depends(get_db)):
    vehicle = await db.get(Vehicle, id)
    if vehicle is None:
        raise ApiError.not_found("Vehicle not found")
    vehicle.approval_status = VehicleApprovalStatus(payload.status)
    vehicle.rejection_reason = payload.rejectionReason
    await db.commit()
    await db.refresh(vehicle)
    return success_response(orm_to_dict(vehicle))


@router.post("/{id}/boost", dependencies=[admin_only, Depends(require_permission("vehicles.boost"))], status_code=201)
async def boost_vehicle(
    id: UuidPath, payload: BoostVehicleInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.BOOSTED_LISTINGS):
        raise ApiError.bad_request("Boosted listings are not currently enabled")

    vehicle = await db.get(Vehicle, id)
    if vehicle is None:
        raise ApiError.not_found("Vehicle not found")

    ends_at = datetime.now(timezone.utc) + timedelta(days=payload.days)
    vehicle.is_featured = True
    vehicle.featured_until = ends_at
    db.add(VehicleBoost(vehicle_id=vehicle.id, granted_by_id=user.id, ends_at=ends_at, amount_charged=payload.amountCharged))
    await db.commit()
    await db.refresh(vehicle)
    return success_response(orm_to_dict(vehicle), 201)
