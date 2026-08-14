import math
import secrets
import time
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.money import round_money
from app.core.datetimes import ensure_aware
from app.core.responses import ApiError
from app.db.enums import (
    BookingStatus,
    DrivingLicenseStatus,
    MonetizationFeatureKey,
    NotificationChannel,
    PaymentStatus,
    TransactionStatus,
    TransactionType,
    VehicleApprovalStatus,
)
from app.db.models import Booking, BookingStatusHistory, Coupon, DrivingLicense, Payment, Transaction, Vehicle
from app.modules.monetization import service as monetization_service
from app.modules.notifications.service import notify
from app.modules.payments.service import refund_payment
from app.modules.payouts.service import record_booking_commission
from app.modules.vehicles.service import is_vehicle_available

TAX_RATE = Decimal("0.18")  # 18% — matches most GST-style jurisdictions; make configurable per-region later.

ALLOWED_TRANSITIONS: dict[BookingStatus, tuple[BookingStatus, ...]] = {
    BookingStatus.PENDING: (BookingStatus.CONFIRMED, BookingStatus.CANCELLED),
    BookingStatus.CONFIRMED: (BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED),
    BookingStatus.APPROVED: (BookingStatus.VEHICLE_READY, BookingStatus.CANCELLED),
    BookingStatus.REJECTED: (),
    BookingStatus.VEHICLE_READY: (BookingStatus.PICKED_UP, BookingStatus.CANCELLED),
    BookingStatus.PICKED_UP: (BookingStatus.ACTIVE,),
    BookingStatus.ACTIVE: (BookingStatus.RETURNING,),
    BookingStatus.RETURNING: (BookingStatus.COMPLETED,),
    BookingStatus.COMPLETED: (),
    BookingStatus.CANCELLED: (),
}

_BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def _to_base36(n: int) -> str:
    if n == 0:
        return "0"
    digits = []
    while n:
        n, rem = divmod(n, 36)
        digits.append(_BASE36[rem])
    return "".join(reversed(digits))


def _generate_booking_number() -> str:
    rand = "".join(secrets.choice(_BASE36) for _ in range(6)).upper()
    timestamp = _to_base36(int(time.time() * 1000)).upper()
    return f"BK-{timestamp}-{rand}"






def _fee_amount(config: dict, base_price: Decimal) -> Decimal:
    """Shared FLAT|PERCENTAGE-with-cap computation for service fee / payout fee style configs."""
    fee_type = config.get("type", "FLAT")
    value = Decimal(str(config.get("value", 0)))
    amount = base_price * value / Decimal(100) if fee_type == "PERCENTAGE" else value
    cap = config.get("cap")
    if cap is not None:
        amount = min(amount, Decimal(str(cap)))
    return round_money(max(amount, Decimal("0")))


async def get_booking_fee_config(db: AsyncSession) -> dict:
    """Reads the three independent booking-time-fee toggles (service fee,
    extra-driver surcharge, young-driver surcharge) once per booking creation.
    A key is present only when its toggle is enabled — absence means "no fee",
    keeping `calculate_price` itself synchronous and toggle-agnostic."""
    config: dict = {}
    if await monetization_service.is_enabled(db, MonetizationFeatureKey.SERVICE_FEE):
        config["serviceFee"] = await monetization_service.get_config(db, MonetizationFeatureKey.SERVICE_FEE)
    if await monetization_service.is_enabled(db, MonetizationFeatureKey.EXTRA_DRIVER_FEE):
        config["extraDriverFee"] = await monetization_service.get_config(db, MonetizationFeatureKey.EXTRA_DRIVER_FEE)
    if await monetization_service.is_enabled(db, MonetizationFeatureKey.YOUNG_DRIVER_FEE):
        config["youngDriverFee"] = await monetization_service.get_config(db, MonetizationFeatureKey.YOUNG_DRIVER_FEE)
    return config


def calculate_price(
    *,
    price_per_hour: Decimal,
    price_per_day: Decimal,
    security_deposit: Decimal,
    pickup: datetime,
    ret: datetime,
    coupon: dict | None = None,
    extra_driver_count: int = 0,
    is_young_driver: bool = False,
    fee_config: dict | None = None,
) -> dict:
    duration_hours = (ret - pickup).total_seconds() / 3600
    full_days = math.floor(duration_hours / 24)
    remaining_hours = math.ceil(duration_hours - full_days * 24)

    base_price = Decimal(full_days) * price_per_day + Decimal(remaining_hours) * price_per_hour

    discount_amount = Decimal("0")
    if coupon:
        if coupon["type"] == "PERCENTAGE":
            discount_amount = base_price * coupon["value"] / Decimal(100)
        else:
            discount_amount = coupon["value"]
        if coupon.get("maxDiscount") is not None:
            discount_amount = min(discount_amount, coupon["maxDiscount"])
        discount_amount = min(discount_amount, base_price)

    taxable_amount = base_price - discount_amount
    tax_amount = round_money(taxable_amount * TAX_RATE)

    # Convenience fees/surcharges are neither discountable nor taxed — they're
    # platform charges layered on top of the rental price itself, same
    # treatment as the (also untaxed, also non-discountable) security deposit.
    fee_config = fee_config or {}
    service_fee_amount = _fee_amount(fee_config["serviceFee"], base_price) if fee_config.get("serviceFee") else Decimal("0")
    extra_driver_fee_amount = (
        round_money(Decimal(str(fee_config["extraDriverFee"]["perDriverFlat"])) * extra_driver_count)
        if fee_config.get("extraDriverFee") and extra_driver_count > 0
        else Decimal("0")
    )
    young_driver_fee_amount = (
        round_money(Decimal(str(fee_config["youngDriverFee"]["flat"])))
        if fee_config.get("youngDriverFee") and is_young_driver
        else Decimal("0")
    )

    total_amount = round_money(
        taxable_amount + tax_amount + security_deposit + service_fee_amount + extra_driver_fee_amount + young_driver_fee_amount
    )

    return {
        "base_price": round_money(base_price),
        "discount_amount": round_money(discount_amount),
        "tax_amount": tax_amount,
        "security_deposit": security_deposit,
        "service_fee_amount": service_fee_amount,
        "extra_driver_fee_amount": extra_driver_fee_amount,
        "young_driver_fee_amount": young_driver_fee_amount,
        "extra_driver_count": extra_driver_count,
        "is_young_driver": is_young_driver,
        "total_amount": total_amount,
    }


async def create_booking(
    db: AsyncSession,
    *,
    customer_id: str,
    vehicle_id: str,
    driving_license_id: str,
    pickup_datetime: datetime,
    return_datetime: datetime,
    pickup_location: str,
    return_location: str,
    pickup_latitude: float | None = None,
    pickup_longitude: float | None = None,
    return_latitude: float | None = None,
    return_longitude: float | None = None,
    coupon_code: str | None = None,
    extra_driver_count: int = 0,
    is_young_driver: bool = False,
) -> Booking:
    vehicle = await db.get(Vehicle, vehicle_id)
    if vehicle is None or not vehicle.is_active or vehicle.approval_status != VehicleApprovalStatus.APPROVED:
        raise ApiError.bad_request("Vehicle is not available for booking")

    license_ = await db.get(DrivingLicense, driving_license_id)
    if license_ is None or license_.user_id != customer_id:
        raise ApiError.bad_request("Invalid driving license")
    if license_.status != DrivingLicenseStatus.VERIFIED:
        raise ApiError.bad_request("Your driving license must be verified before booking")
    if license_.expiry_date < return_datetime:
        raise ApiError.bad_request("Your driving license expires before the rental period ends")

    if not await is_vehicle_available(db, vehicle_id, pickup_datetime, return_datetime):
        raise ApiError.conflict("Vehicle is not available for the selected dates")

    coupon: Coupon | None = None
    if coupon_code:
        coupon = (await db.execute(select(Coupon).where(Coupon.code == coupon_code))).scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if coupon is None or not coupon.is_active or coupon.valid_from > now or coupon.valid_until < now:
            raise ApiError.bad_request("Coupon is invalid or expired")
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            raise ApiError.bad_request("Coupon usage limit reached")

        user_usage = (
            await db.execute(
                select(func.count())
                .select_from(Booking)
                .where(
                    Booking.customer_id == customer_id,
                    Booking.coupon_id == coupon.id,
                    Booking.status != BookingStatus.CANCELLED,
                )
            )
        ).scalar_one()
        if user_usage >= coupon.per_user_limit:
            raise ApiError.bad_request("You have already used this coupon")

    fee_config = await get_booking_fee_config(db)
    pricing = calculate_price(
        price_per_hour=vehicle.price_per_hour,
        price_per_day=vehicle.price_per_day,
        security_deposit=vehicle.security_deposit,
        pickup=pickup_datetime,
        ret=return_datetime,
        coupon={"type": coupon.type.value, "value": coupon.value, "maxDiscount": coupon.max_discount} if coupon else None,
        extra_driver_count=extra_driver_count,
        is_young_driver=is_young_driver,
        fee_config=fee_config,
    )

    if coupon and pricing["base_price"] < (coupon.min_booking_value or Decimal("0")):
        raise ApiError.bad_request("Booking amount does not meet the coupon's minimum value")

    booking = Booking(
        booking_number=_generate_booking_number(),
        customer_id=customer_id,
        vehicle_id=vehicle_id,
        rental_partner_id=vehicle.rental_partner_id,
        driving_license_id=driving_license_id,
        coupon_id=coupon.id if coupon else None,
        pickup_datetime=pickup_datetime,
        return_datetime=return_datetime,
        pickup_location=pickup_location,
        return_location=return_location,
        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,
        return_latitude=return_latitude,
        return_longitude=return_longitude,
        status=BookingStatus.PENDING,
        **pricing,
    )
    db.add(booking)
    await db.flush()

    db.add(
        BookingStatusHistory(booking_id=booking.id, status=BookingStatus.PENDING, note="Booking created, awaiting payment")
    )

    if coupon is not None:
        coupon.usage_count += 1

    await db.commit()
    await db.refresh(booking)
    return booking


async def _record_late_return_fee(db: AsyncSession, booking: Booking, actual_return_at: datetime) -> None:
    """Booking is already fully paid by the time it completes and there is no
    charge-on-file capability anywhere in this codebase, so a late fee can only
    be *recorded* (a PENDING Transaction, surfaced to admin/partner for manual
    follow-up) — never auto-deducted from anything."""
    booking.actual_return_at = actual_return_at

    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.LATE_RETURN_FEE):
        return

    config = await monetization_service.get_config(db, MonetizationFeatureKey.LATE_RETURN_FEE)
    grace_minutes = config.get("gracePeriodMinutes", 30)
    per_hour = Decimal(str(config.get("perHourAmount", 0)))
    max_amount = config.get("maxAmount")

    late_minutes = (ensure_aware(actual_return_at) - ensure_aware(booking.return_datetime)).total_seconds() / 60 - grace_minutes
    if late_minutes <= 0:
        return

    fee = round_money(Decimal(late_minutes / 60) * per_hour)
    if max_amount is not None:
        fee = min(fee, Decimal(str(max_amount)))
    if fee <= 0:
        return

    booking.late_return_fee_amount = fee
    db.add(
        Transaction(
            type=TransactionType.LATE_RETURN_FEE,
            status=TransactionStatus.PENDING,
            amount=fee,
            rental_partner_id=booking.rental_partner_id,
            reference=booking.booking_number,
        )
    )


async def transition_status(
    db: AsyncSession,
    booking_id: str,
    next_status: BookingStatus,
    actor_id: str,
    note: str | None = None,
    actual_return_at: datetime | None = None,
) -> Booking:
    booking = await db.get(Booking, booking_id)
    if booking is None:
        raise ApiError.not_found("Booking not found")

    allowed = ALLOWED_TRANSITIONS[booking.status]
    if next_status not in allowed:
        raise ApiError.bad_request(f"Cannot transition booking from {booking.status.value} to {next_status.value}")

    booking.status = next_status
    db.add(BookingStatusHistory(booking_id=booking_id, status=next_status, note=note, changed_by_id=actor_id))

    if next_status == BookingStatus.COMPLETED:
        vehicle = await db.get(Vehicle, booking.vehicle_id)
        vehicle.total_bookings += 1
        await record_booking_commission(db, booking)
        await _record_late_return_fee(db, booking, actual_return_at or datetime.now(timezone.utc))

    await db.commit()
    await db.refresh(booking)

    await notify(
        db,
        booking.customer_id,
        "Booking update",
        f"Your booking {booking.booking_number} is now {next_status.value.replace('_', ' ').lower()}.",
        NotificationChannel.IN_APP,
        {"bookingId": booking_id, "status": next_status.value},
    )

    return booking


def calculate_cancellation_fee(*, taxable_amount: Decimal, hours_before_pickup: float, tiers: list[dict]) -> Decimal:
    """Tiered by lead time. Tiers are `{hoursBeforePickup, feePercentage}`; the
    tier with the *largest* `hoursBeforePickup` threshold that the actual lead
    time still clears applies — e.g. tiers at 48h/0%, 24h/25%, 0h/50% mean free
    before 48h, 25% between 24-48h, 50% under 24h. No tiers configured, or lead
    time below every threshold, means no fee (fails open, never overcharges)."""
    if not tiers:
        return Decimal("0")
    applicable = [t for t in tiers if hours_before_pickup >= t["hoursBeforePickup"]]
    if not applicable:
        return Decimal("0")
    best = max(applicable, key=lambda t: t["hoursBeforePickup"])
    fee_percentage = Decimal(str(best["feePercentage"]))
    return round_money(taxable_amount * fee_percentage / Decimal(100))


async def _compute_cancellation_fee_for_booking(db: AsyncSession, booking: Booking) -> Decimal:
    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.CANCELLATION_FEE):
        return Decimal("0")
    config = await monetization_service.get_config(db, MonetizationFeatureKey.CANCELLATION_FEE)
    now = datetime.now(timezone.utc)
    hours_before_pickup = max(0.0, (ensure_aware(booking.pickup_datetime) - now).total_seconds() / 3600)
    taxable_amount = booking.base_price - booking.discount_amount
    return calculate_cancellation_fee(
        taxable_amount=taxable_amount, hours_before_pickup=hours_before_pickup, tiers=config.get("tiers", [])
    )


async def _find_refundable_payment(db: AsyncSession, booking_id: str) -> Payment | None:
    stmt = select(Payment).where(
        Payment.booking_id == booking_id, Payment.status.in_((PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED))
    )
    return (await db.execute(stmt)).scalars().first()


async def preview_cancellation(db: AsyncSession, booking_id: str, requester_id: str) -> dict:
    booking = await db.get(Booking, booking_id)
    if booking is None:
        raise ApiError.not_found("Booking not found")
    if booking.customer_id != requester_id:
        raise ApiError.forbidden()

    fee = await _compute_cancellation_fee_for_booking(db, booking)
    payment = await _find_refundable_payment(db, booking_id)
    paid_amount = (payment.amount - payment.refunded_amount) if payment else Decimal("0")
    refund_amount = max(Decimal("0"), paid_amount - fee)

    return {"feeAmount": fee, "refundAmount": refund_amount}


async def cancel_booking(db: AsyncSession, booking_id: str, actor_id: str, reason: str | None) -> Booking:
    booking = await db.get(Booking, booking_id)
    if booking is None:
        raise ApiError.not_found("Booking not found")

    fee = await _compute_cancellation_fee_for_booking(db, booking)
    booking.cancellation_fee_amount = fee

    updated = await transition_status(db, booking_id, BookingStatus.CANCELLED, actor_id, reason)

    payment = await _find_refundable_payment(db, booking_id)
    if payment is not None:
        paid_amount = payment.amount - payment.refunded_amount
        refund_amount = max(Decimal("0"), paid_amount - fee)
        if refund_amount > 0:
            await refund_payment(db, payment.id, refund_amount, reason or "Booking cancelled")

    return updated
