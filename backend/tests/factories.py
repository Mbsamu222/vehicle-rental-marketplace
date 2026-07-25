"""Minimal ORM fixture builders for tests — just enough FK chain to create a
bookable vehicle (Country -> City -> User -> RentalPartner -> Category/Brand -> Vehicle)."""
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import (
    AccountStatus,
    BookingStatus,
    FuelType,
    PartnerVerificationStatus,
    PaymentProvider,
    PaymentStatus,
    UserType,
    VehicleApprovalStatus,
    VehicleTransmission,
)
from app.db.models import Booking, City, Country, Payment, RentalPartner, User, Vehicle, VehicleBrand, VehicleCategory


async def make_vehicle(db: AsyncSession, *, is_active: bool = True, approved: bool = True) -> Vehicle:
    unique = uuid.uuid4().hex[:10]
    country = Country(name=f"Country-{unique}", code=unique[:4].upper())
    city = City(name="Chennai", country=country)
    user = User(
        firebase_uid=f"fb-{unique}",
        email=f"partner-{unique}@example.com",
        first_name="Test",
        last_name="Partner",
        user_type=UserType.RENTAL_PARTNER,
        account_status=AccountStatus.ACTIVE,
    )
    partner = RentalPartner(
        user=user,
        business_name="Test Rentals",
        business_email="ops@example.com",
        business_phone="+911234567890",
        city=city,
        address="1 Test Street",
        verification_status=PartnerVerificationStatus.VERIFIED,
    )
    category = VehicleCategory(name=f"Cat-{unique}", slug=f"cat-{unique}")
    brand = VehicleBrand(name=f"Brand-{unique}")
    vehicle = Vehicle(
        rental_partner=partner,
        category=category,
        brand=brand,
        city=city,
        model="Test Model",
        year=2024,
        registration_number=f"TN-{unique}",
        transmission=VehicleTransmission.MANUAL,
        fuel_type=FuelType.PETROL,
        seating_capacity=4,
        price_per_hour=Decimal("50"),
        price_per_day=Decimal("1000"),
        is_active=is_active,
        approval_status=VehicleApprovalStatus.APPROVED if approved else VehicleApprovalStatus.PENDING,
    )
    db.add_all([country, city, user, partner, category, brand, vehicle])
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


async def make_completed_booking(
    db: AsyncSession, vehicle: Vehicle, *, base_price: Decimal = Decimal("1000"), discount_amount: Decimal = Decimal("0")
) -> Booking:
    """Directly constructs a COMPLETED booking, bypassing the full create-booking
    flow (driving license, payment, availability) — appropriate for unit-testing
    the payout/commission math, which only cares about the booking's final state
    and price fields."""
    unique = uuid.uuid4().hex[:10]
    customer = User(
        firebase_uid=f"fb-cust-{unique}",
        email=f"customer-{unique}@example.com",
        first_name="Test",
        last_name="Customer",
        user_type=UserType.CUSTOMER,
        account_status=AccountStatus.ACTIVE,
    )
    now = datetime.now(timezone.utc)
    booking = Booking(
        booking_number=f"BK-{unique}",
        customer=customer,
        vehicle_id=vehicle.id,
        rental_partner_id=vehicle.rental_partner_id,
        pickup_datetime=now - timedelta(days=2),
        return_datetime=now - timedelta(days=1),
        pickup_location="Test pickup",
        return_location="Test return",
        base_price=base_price,
        discount_amount=discount_amount,
        tax_amount=Decimal("0"),
        security_deposit=Decimal("0"),
        total_amount=base_price - discount_amount,
        status=BookingStatus.COMPLETED,
    )
    db.add_all([customer, booking])
    await db.commit()
    await db.refresh(booking)
    return booking


async def make_booking(
    db: AsyncSession,
    vehicle: Vehicle,
    *,
    status: BookingStatus = BookingStatus.PENDING,
    base_price: Decimal = Decimal("1000"),
    discount_amount: Decimal = Decimal("0"),
    pickup_datetime: datetime | None = None,
    return_datetime: datetime | None = None,
) -> Booking:
    unique = uuid.uuid4().hex[:10]
    customer = User(
        firebase_uid=f"fb-cust-{unique}",
        email=f"customer-{unique}@example.com",
        first_name="Test",
        last_name="Customer",
        user_type=UserType.CUSTOMER,
        account_status=AccountStatus.ACTIVE,
    )
    pickup = pickup_datetime or datetime.now(timezone.utc) + timedelta(days=2)
    ret = return_datetime or pickup + timedelta(days=1)
    booking = Booking(
        booking_number=f"BK-{unique}",
        customer=customer,
        vehicle_id=vehicle.id,
        rental_partner_id=vehicle.rental_partner_id,
        pickup_datetime=pickup,
        return_datetime=ret,
        pickup_location="Test pickup",
        return_location="Test return",
        base_price=base_price,
        discount_amount=discount_amount,
        tax_amount=Decimal("0"),
        security_deposit=Decimal("0"),
        total_amount=base_price - discount_amount,
        status=status,
    )
    db.add_all([customer, booking])
    await db.commit()
    await db.refresh(booking)
    return booking


async def make_payment(
    db: AsyncSession,
    booking: Booking,
    *,
    amount: Decimal | None = None,
    status: PaymentStatus = PaymentStatus.PAID,
    provider: PaymentProvider = PaymentProvider.RAZORPAY,
) -> Payment:
    payment = Payment(
        booking_id=booking.id,
        provider=provider,
        amount=amount if amount is not None else booking.total_amount,
        status=status,
        paid_at=datetime.now(timezone.utc) if status == PaymentStatus.PAID else None,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment
