"""Optional demo dataset: a rental partner with self-drive vehicles, plus
hireable drivers.

Kept out of `seed.py` because `seed.py` bootstraps things the app genuinely
needs (permissions, roles, the super admin, catalog reference data), whereas
this is illustrative content you would not want in a production database.

    cd backend && python -m scripts.sample_data
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.db.enums import (
    AccountStatus,
    DriverVerificationStatus,
    FuelType,
    PartnerVerificationStatus,
    UserType,
    VehicleApprovalStatus,
    VehicleTransmission,
)
from app.db.models import (
    City,
    Driver,
    RentalPartner,
    User,
    Vehicle,
    VehicleBrand,
    VehicleCategory,
)
from app.db.session import AsyncSessionLocal

PARTNER_EMAIL = "citydrive@example.com"

# Self-drive fleet. Rates are indicative Chennai pricing in INR.
VEHICLES = [
    # (brand, model, year, category slug, transmission, fuel, seats, /hr, /day, deposit)
    ("Maruti Suzuki", "Swift", 2023, "hatchback", VehicleTransmission.MANUAL, FuelType.PETROL, 5, 120, 1800, 3000),
    ("Hyundai", "i20", 2023, "hatchback", VehicleTransmission.AUTOMATIC, FuelType.PETROL, 5, 150, 2200, 3500),
    ("Honda", "City", 2022, "sedan", VehicleTransmission.AUTOMATIC, FuelType.PETROL, 5, 190, 2800, 5000),
    ("Tata", "Nexon EV", 2024, "electric", VehicleTransmission.AUTOMATIC, FuelType.ELECTRIC, 5, 210, 3200, 6000),
    ("Mahindra", "Scorpio-N", 2023, "suv", VehicleTransmission.MANUAL, FuelType.DIESEL, 7, 260, 4000, 8000),
    ("Toyota", "Innova Crysta", 2023, "suv", VehicleTransmission.AUTOMATIC, FuelType.DIESEL, 7, 300, 4500, 9000),
]

# Hireable chauffeurs.
DRIVERS = [
    ("Ravi", "Kumar", 12, 1200, 150, "Tamil, English, Hindi", "Airport runs and long-distance highway trips."),
    ("Suresh", "Babu", 8, 1000, 130, "Tamil, English", "City driving and corporate travel."),
    ("Anitha", "Raj", 6, 1100, 140, "Tamil, English, Malayalam", "Family trips and outstation weekends."),
    ("Mohammed", "Irfan", 15, 1400, 175, "Tamil, English, Hindi, Urdu", "Executive chauffeur, luxury vehicles."),
]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        city = (await db.execute(select(City).where(City.name == "Chennai"))).scalar_one_or_none()
        if city is None:
            raise SystemExit("Run `python -m scripts.seed` first — no Chennai city row found.")

        # ── Rental partner ────────────────────────────────────────────────
        partner = (
            await db.execute(
                select(RentalPartner).join(User).where(User.email == PARTNER_EMAIL)
            )
        ).scalar_one_or_none()

        if partner is None:
            owner = User(
                firebase_uid=f"sample-partner-{uuid.uuid4().hex[:8]}",
                email=PARTNER_EMAIL,
                first_name="Karan",
                last_name="Shah",
                phone="+919000000001",
                user_type=UserType.RENTAL_PARTNER,
                account_status=AccountStatus.ACTIVE,
            )
            partner = RentalPartner(
                user=owner,
                business_name="CityDrive Rentals",
                business_email=PARTNER_EMAIL,
                business_phone="+919000000001",
                city=city,
                address="12 Usman Road, T Nagar, Chennai",
                verification_status=PartnerVerificationStatus.VERIFIED,
                description="Self-drive cars and SUVs across Chennai. Sanitised, insured, and documented.",
            )
            db.add_all([owner, partner])
            await db.commit()
            await db.refresh(partner)
            print(f"  partner created: {partner.business_name}")
        else:
            print(f"  partner exists: {partner.business_name}")

        # ── Self-drive vehicles ───────────────────────────────────────────
        created = 0
        for brand_name, model, year, slug, transmission, fuel, seats, hourly, daily, deposit in VEHICLES:
            brand = (await db.execute(select(VehicleBrand).where(VehicleBrand.name == brand_name))).scalar_one_or_none()
            category = (
                await db.execute(select(VehicleCategory).where(VehicleCategory.slug == slug))
            ).scalar_one_or_none()
            if brand is None or category is None:
                print(f"    skip {brand_name} {model} (missing brand/category — run seed.py)")
                continue

            reg = f"TN01{model[:2].upper()}{year % 100}{seats}"
            if (await db.execute(select(Vehicle).where(Vehicle.registration_number == reg))).scalar_one_or_none():
                continue

            db.add(
                Vehicle(
                    rental_partner_id=partner.id,
                    category_id=category.id,
                    brand_id=brand.id,
                    city_id=city.id,
                    model=model,
                    year=year,
                    registration_number=reg,
                    transmission=transmission,
                    fuel_type=fuel,
                    seating_capacity=seats,
                    price_per_hour=Decimal(hourly),
                    price_per_day=Decimal(daily),
                    security_deposit=Decimal(deposit),
                    insurance_details="Comprehensive insurance with zero-depreciation cover.",
                    rental_policies="Fuel-to-fuel. 300 km/day included, ₹12/km after. No smoking.",
                    approval_status=VehicleApprovalStatus.APPROVED,
                    is_active=True,
                )
            )
            created += 1
        await db.commit()
        print(f"  vehicles added: {created}")

        # ── Drivers ───────────────────────────────────────────────────────
        added = 0
        for first, last, years, daily, hourly, languages, bio in DRIVERS:
            email = f"{first.lower()}.{last.lower()}@example.com"
            if (await db.execute(select(User).where(User.email == email))).scalar_one_or_none():
                continue

            user = User(
                firebase_uid=f"sample-driver-{uuid.uuid4().hex[:8]}",
                email=email,
                first_name=first,
                last_name=last,
                phone=f"+9190000{1000 + added:04d}",
                user_type=UserType.DRIVER,
                account_status=AccountStatus.ACTIVE,
            )
            db.add(
                Driver(
                    user=user,
                    city_id=city.id,
                    license_number=f"TN{20 + added}2019{7000000 + added}",
                    license_expiry=datetime.now(timezone.utc) + timedelta(days=365 * 4),
                    years_of_experience=years,
                    daily_rate=Decimal(daily),
                    hourly_rate=Decimal(hourly),
                    languages=languages,
                    bio=bio,
                    # Pre-verified so the hire flow is demoable immediately.
                    verification_status=DriverVerificationStatus.VERIFIED,
                    is_available=True,
                )
            )
            added += 1
        await db.commit()
        print(f"  drivers added: {added}")

        print("\nSample data ready. Drivers are pre-verified and hireable.")


if __name__ == "__main__":
    asyncio.run(main())
