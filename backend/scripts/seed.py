import asyncio
from datetime import datetime, timezone

from firebase_admin import auth as firebase_auth
from sqlalchemy import select

from app.core.firebase import create_user as create_firebase_user
from app.db.enums import AccountStatus, UserType
from app.db.models import (
    City,
    Country,
    HeroBannerSlide,
    Permission,
    Role,
    RolePermission,
    SubscriptionPlan,
    User,
    UserRole,
    VehicleBrand,
    VehicleCategory,
)
from app.db.session import AsyncSessionLocal

PERMISSIONS = [
    {"key": "partners.view", "module": "partners", "description": "View rental partner profiles and documents"},
    {"key": "partners.verify", "module": "partners", "description": "Approve or reject partner KYC/verification"},
    {"key": "vehicles.approve", "module": "vehicles", "description": "Approve or reject vehicle listings"},
    {"key": "payments.view", "module": "payments", "description": "View transactions and payment records"},
    {"key": "payments.refund", "module": "payments", "description": "Issue refunds for payments"},
    {"key": "coupons.manage", "module": "coupons", "description": "Create and manage coupons"},
    {"key": "support.manage", "module": "support", "description": "Manage support tickets"},
    {"key": "analytics.view", "module": "analytics", "description": "View platform analytics dashboard"},
    {"key": "roles.manage", "module": "roles", "description": "Manage roles, permissions, and admin assignments"},
    {"key": "users.manage", "module": "users", "description": "Manage customer/partner account status"},
    {"key": "audit.view", "module": "audit", "description": "View audit logs"},
    {"key": "cms.manage", "module": "cms", "description": "Manage CMS pages and blog posts"},
    {"key": "settings.manage", "module": "settings", "description": "Manage system settings"},
    {"key": "monetization.manage", "module": "monetization", "description": "Toggle and configure revenue features"},
    {"key": "vehicles.boost", "module": "vehicles", "description": "Grant boosted/featured placement to a vehicle"},
    {"key": "ads.manage", "module": "ads", "description": "Manage sponsored ad slots"},
    {"key": "affiliates.manage", "module": "affiliates", "description": "Manage affiliate partner directory"},
    {"key": "payouts.manage", "module": "payouts", "description": "Trigger and view rental partner payouts"},
    {"key": "subscriptions.manage", "module": "subscriptions", "description": "Manage subscription plans and confirm partner subscriptions"},
]

CATEGORIES = [
    {"name": "Hatchback", "slug": "hatchback"},
    {"name": "Sedan", "slug": "sedan"},
    {"name": "SUV", "slug": "suv"},
    {"name": "Luxury", "slug": "luxury"},
    {"name": "Bike", "slug": "bike"},
    {"name": "Electric", "slug": "electric"},
]

BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Toyota", "Honda", "Kia", "MG"]

HERO_BANNER_SLIDES = [
    {
        "title": "Rent Smarter. Drive Unlimited Possibilities.",
        "subtitle": "Connect directly with top-rated local rental partners for cars, bikes, and luxury rides.",
        "imageUrl": "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1920&q=80",
        "ctaLabel": "Browse vehicles",
        "ctaUrl": "/search",
        "sortOrder": 1,
    },
    {
        "title": "Luxury Rides, Everyday Prices.",
        "subtitle": "Premium sedans and SUVs from verified partners — transparent pricing, zero hidden fees.",
        "imageUrl": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1920&q=80",
        "ctaLabel": "Explore luxury fleet",
        "ctaUrl": "/categories",
        "sortOrder": 2,
    },
    {
        "title": "Two Wheels, Total Freedom.",
        "subtitle": "Bikes and scooters for quick city rides, delivered ready to go in minutes.",
        "imageUrl": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1920&q=80",
        "ctaLabel": "Find a ride",
        "ctaUrl": "/search?categoryId=",
        "sortOrder": 3,
    },
    {
        "title": "Instant Booking. Zero Waiting.",
        "subtitle": "Reserve in seconds and get instant confirmation from trusted local rental outlets.",
        "imageUrl": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80",
        "ctaLabel": "Get started",
        "ctaUrl": "/search",
        "sortOrder": 4,
    },
    {
        "title": "Become a Rental Partner.",
        "subtitle": "List your vehicles and reach thousands of verified renters across the city.",
        "imageUrl": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1920&q=80",
        "ctaLabel": "Partner with us",
        "ctaUrl": "/become-a-partner",
        "sortOrder": 5,
    },
]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        print("Seeding permissions...")
        permission_by_key: dict[str, Permission] = {}
        for entry in PERMISSIONS:
            existing = (await db.execute(select(Permission).where(Permission.key == entry["key"]))).scalar_one_or_none()
            if existing is None:
                existing = Permission(**entry)
                db.add(existing)
                await db.flush()
            else:
                existing.module = entry["module"]
                existing.description = entry["description"]
            permission_by_key[entry["key"]] = existing
        await db.commit()

        print("Seeding Super Admin role...")
        all_permissions = (await db.execute(select(Permission))).scalars().all()
        super_admin_role = (await db.execute(select(Role).where(Role.name == "Super Admin"))).scalar_one_or_none()
        if super_admin_role is None:
            super_admin_role = Role(name="Super Admin", description="Full platform access", is_system=True)
            db.add(super_admin_role)
            await db.flush()
            for permission in all_permissions:
                db.add(RolePermission(role_id=super_admin_role.id, permission_id=permission.id))
            await db.commit()

        support_agent_role = (await db.execute(select(Role).where(Role.name == "Support Agent"))).scalar_one_or_none()
        if support_agent_role is None:
            support_agent_role = Role(name="Support Agent", description="Handles customer support tickets and reviews")
            db.add(support_agent_role)
            await db.flush()
            for key in ("support.manage", "audit.view"):
                db.add(RolePermission(role_id=support_agent_role.id, permission_id=permission_by_key[key].id))
            await db.commit()

        print("Seeding Super Admin user...")
        super_admin_email = "admin@rentalmarketplace.example"
        super_admin_user = (await db.execute(select(User).where(User.email == super_admin_email))).scalar_one_or_none()
        if super_admin_user is None:
            try:
                firebase_user = create_firebase_user(email=super_admin_email, password="ChangeMe123!", email_verified=True)
            except firebase_auth.EmailAlreadyExistsError:
                firebase_user = firebase_auth.get_user_by_email(super_admin_email)

            super_admin_user = User(
                firebase_uid=firebase_user.uid,
                email=super_admin_email,
                first_name="Platform",
                last_name="Admin",
                user_type=UserType.SUPER_ADMIN,
                account_status=AccountStatus.ACTIVE,
                referral_code="SUPERADMIN",
            )
            super_admin_user.email_verified_at = datetime.now(timezone.utc)
            db.add(super_admin_user)
            await db.flush()
            await db.commit()

        existing_assignment = await db.get(UserRole, {"user_id": super_admin_user.id, "role_id": super_admin_role.id})
        if existing_assignment is None:
            db.add(UserRole(user_id=super_admin_user.id, role_id=super_admin_role.id))
            await db.commit()

        print("Seeding countries and cities...")
        india = (await db.execute(select(Country).where(Country.code == "IN"))).scalar_one_or_none()
        if india is None:
            india = Country(name="India", code="IN")
            db.add(india)
            await db.flush()
            await db.commit()

        # Launching in a single city first — more cities are added later via the
        # admin catalog management screen as the platform expands, not pre-seeded.
        for city_name, is_popular in [("Chennai", True)]:
            city = (
                await db.execute(select(City).where(City.name == city_name, City.country_id == india.id))
            ).scalar_one_or_none()
            if city is None:
                db.add(City(name=city_name, country_id=india.id, is_popular=is_popular))
            else:
                city.is_popular = is_popular
        await db.commit()

        print("Seeding vehicle categories...")
        for category in CATEGORIES:
            existing = (await db.execute(select(VehicleCategory).where(VehicleCategory.slug == category["slug"]))).scalar_one_or_none()
            if existing is None:
                db.add(VehicleCategory(**category))
        await db.commit()

        print("Seeding vehicle brands...")
        for name in BRANDS:
            existing = (await db.execute(select(VehicleBrand).where(VehicleBrand.name == name))).scalar_one_or_none()
            if existing is None:
                db.add(VehicleBrand(name=name))
        await db.commit()

        print("Seeding hero banner slides...")
        for slide in HERO_BANNER_SLIDES:
            existing = (
                await db.execute(select(HeroBannerSlide).where(HeroBannerSlide.title == slide["title"]))
            ).scalar_one_or_none()
            data = {
                "title": slide["title"],
                "subtitle": slide["subtitle"],
                "image_url": slide["imageUrl"],
                "cta_label": slide["ctaLabel"],
                "cta_url": slide["ctaUrl"],
                "sort_order": slide["sortOrder"],
            }
            if existing is None:
                db.add(HeroBannerSlide(**data))
            else:
                for field, value in data.items():
                    setattr(existing, field, value)
        await db.commit()

        print("Seeding subscription plans...")
        existing_plan = (await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == "Starter"))).scalar_one_or_none()
        if existing_plan is None:
            db.add(
                SubscriptionPlan(
                    name="Starter",
                    description="For partners listing up to 10 vehicles",
                    price=999,
                    duration_days=30,
                    max_vehicles=10,
                    features={"support": "email", "listingBoost": False},
                )
            )
        existing_pro_plan = (await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == "Pro"))).scalar_one_or_none()
        if existing_pro_plan is None:
            db.add(
                SubscriptionPlan(
                    name="Pro",
                    description="Higher vehicle cap, a lower commission rate, and fleet analytics",
                    price=2999,
                    duration_days=30,
                    max_vehicles=50,
                    features={"support": "priority", "listingBoost": True, "commissionOverride": 7, "analytics": True},
                )
            )
        await db.commit()

        print("Seed complete.")
        print(f"Super Admin login: {super_admin_email} / ChangeMe123! (change this immediately)")


if __name__ == "__main__":
    asyncio.run(main())
