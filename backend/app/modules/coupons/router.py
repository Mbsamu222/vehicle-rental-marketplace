from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import CouponType, UserType
from app.db.models import Coupon
from app.db.session import get_db
from app.deps.auth import get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.coupons.schemas import CreateCouponInput, UpdateCouponInput, ValidateCouponInput

router = APIRouter()

admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))
manage_coupons = Depends(require_permission("coupons.manage"))


@router.post("/validate", dependencies=[Depends(get_current_user)])
async def validate_coupon(payload: ValidateCouponInput, db: AsyncSession = Depends(get_db)):
    coupon = (await db.execute(select(Coupon).where(Coupon.code == payload.code.upper()))).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if coupon is None or not coupon.is_active or coupon.valid_from > now or coupon.valid_until < now:
        raise ApiError.bad_request("Coupon is invalid or expired")
    if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
        raise ApiError.bad_request("Coupon usage limit reached")

    booking_amount = Decimal(str(payload.bookingAmount))
    if coupon.min_booking_value and booking_amount < coupon.min_booking_value:
        raise ApiError.bad_request(f"Minimum booking amount for this coupon is {coupon.min_booking_value}")

    discount = (booking_amount * coupon.value / Decimal(100)) if coupon.type == CouponType.PERCENTAGE else coupon.value
    if coupon.max_discount:
        discount = min(discount, coupon.max_discount)
    discount = min(discount, booking_amount)

    return success_response({"code": coupon.code, "discount": round(float(discount), 2)})


@router.get("", dependencies=[admin_only, manage_coupons])
async def list_coupons(pagination: Pagination = Depends(get_pagination()), db: AsyncSession = Depends(get_db)):
    stmt = select(Coupon).order_by(Coupon.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    coupons = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(Coupon))).scalar_one()
    return success_response(
        [orm_to_dict(c) for c in coupons], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.post("", dependencies=[admin_only, manage_coupons], status_code=201)
async def create_coupon(payload: CreateCouponInput, db: AsyncSession = Depends(get_db)):
    coupon = Coupon(
        code=payload.code,
        type=CouponType(payload.type),
        value=payload.value,
        max_discount=payload.maxDiscount,
        min_booking_value=payload.minBookingValue,
        usage_limit=payload.usageLimit,
        per_user_limit=payload.perUserLimit,
        valid_from=payload.validFrom,
        valid_until=payload.validUntil,
    )
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return success_response(orm_to_dict(coupon), 201)


@router.patch("/{id}", dependencies=[admin_only, manage_coupons])
async def update_coupon(id: UuidPath, payload: UpdateCouponInput, db: AsyncSession = Depends(get_db)):
    coupon = await db.get(Coupon, id)
    if coupon is None:
        raise ApiError.not_found()
    field_map = {
        "maxDiscount": "max_discount",
        "minBookingValue": "min_booking_value",
        "usageLimit": "usage_limit",
        "perUserLimit": "per_user_limit",
        "validFrom": "valid_from",
        "validUntil": "valid_until",
        "isActive": "is_active",
    }
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(coupon, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(coupon)
    return success_response(orm_to_dict(coupon))


@router.delete("/{id}", dependencies=[admin_only, manage_coupons])
async def remove_coupon(id: UuidPath, db: AsyncSession = Depends(get_db)):
    coupon = await db.get(Coupon, id)
    if coupon is None:
        raise ApiError.not_found()
    coupon.is_active = False
    await db.commit()
    return success_response({"message": "Coupon deactivated"})
