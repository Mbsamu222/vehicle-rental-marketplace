from datetime import datetime, timedelta, timezone
from decimal import Decimal

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import BookingStatus, MonetizationFeatureKey, SubscriptionStatus, UserType
from app.db.models import MonetizationFeature, PartnerSubscription, RentalPartner, SubscriptionPlan, Transaction
from app.deps.auth import AuthUser
from app.modules.bookings.service import transition_status
from app.modules.payouts.service import get_effective_commission_rate
from tests.conftest import login_as
from tests.factories import make_booking, make_vehicle


async def _seed_features(db_session: AsyncSession, *enabled: MonetizationFeatureKey) -> None:
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=key in enabled))
    await db_session.commit()


async def _make_plan(db_session: AsyncSession, *, max_vehicles: int | None = None, features: dict | None = None) -> SubscriptionPlan:
    plan = SubscriptionPlan(name=f"Plan-{id(features)}", price=Decimal("999"), duration_days=30, max_vehicles=max_vehicles, features=features)
    db_session.add(plan)
    await db_session.commit()
    await db_session.refresh(plan)
    return plan


async def _make_active_subscription(db_session: AsyncSession, partner_id: str, plan: SubscriptionPlan) -> PartnerSubscription:
    sub = PartnerSubscription(
        rental_partner_id=partner_id,
        plan_id=plan.id,
        status=SubscriptionStatus.ACTIVE,
        started_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db_session.add(sub)
    await db_session.commit()
    return sub


async def test_request_and_confirm_subscription_flow(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    plan = await _make_plan(db_session)
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    requested = await client.post("/api/v1/subscriptions/mine", json={"planId": plan.id})
    assert requested.status_code == 201
    assert requested.json()["data"]["status"] == "PENDING"
    sub_id = requested.json()["data"]["id"]

    duplicate = await client.post("/api/v1/subscriptions/mine", json={"planId": plan.id})
    assert duplicate.status_code == 400

    login_as(AuthUser(id="admin-1", user_type=UserType.SUPER_ADMIN, permissions=[]))
    confirmed = await client.patch(f"/api/v1/subscriptions/{sub_id}/confirm")
    assert confirmed.status_code == 200
    assert confirmed.json()["data"]["status"] == "ACTIVE"
    assert confirmed.json()["data"]["plan"]["id"] == plan.id


async def test_commission_override_takes_precedence_over_flat_rate(db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.BOOKING_COMMISSION, MonetizationFeatureKey.PARTNER_SUBSCRIPTIONS)
    vehicle = await make_vehicle(db_session)  # default commission_rate = 10%
    plan = await _make_plan(db_session, features={"commissionOverride": 5})
    await _make_active_subscription(db_session, vehicle.rental_partner_id, plan)

    booking = await make_booking(db_session, vehicle, status=BookingStatus.RETURNING, base_price=Decimal("1000"))
    await transition_status(db_session, booking.id, BookingStatus.COMPLETED, actor_id="partner-1")

    txns = (await db_session.execute(select(Transaction))).scalars().all()
    commission_txns = [t for t in txns if t.type.value == "COMMISSION"]
    assert len(commission_txns) == 1
    assert commission_txns[0].amount == Decimal("50.00")  # 5% of 1000, not the partner's flat 10%


async def test_get_effective_commission_rate_falls_back_without_subscription(db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.PARTNER_SUBSCRIPTIONS)
    vehicle = await make_vehicle(db_session)
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    rate = await get_effective_commission_rate(db_session, partner)
    assert rate == partner.commission_rate


async def test_vehicle_creation_capped_by_subscription_plan(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.PARTNER_SUBSCRIPTIONS)
    vehicle = await make_vehicle(db_session)  # partner already has 1 active vehicle
    plan = await _make_plan(db_session, max_vehicles=1)
    await _make_active_subscription(db_session, vehicle.rental_partner_id, plan)
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    response = await client.post(
        "/api/v1/vehicles",
        json={
            "categoryId": vehicle.category_id,
            "brandId": vehicle.brand_id,
            "cityId": vehicle.city_id,
            "model": "Second Car",
            "year": 2025,
            "registrationNumber": "TN-SECOND-1",
            "transmission": "MANUAL",
            "fuelType": "PETROL",
            "seatingCapacity": 4,
            "pricePerHour": 50,
            "pricePerDay": 1000,
        },
    )
    assert response.status_code == 400
    assert "plan allows up to 1" in response.json()["message"]


async def test_vehicle_creation_unrestricted_without_any_subscription(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.PARTNER_SUBSCRIPTIONS)
    vehicle = await make_vehicle(db_session)  # no subscription at all for this partner
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    response = await client.post(
        "/api/v1/vehicles",
        json={
            "categoryId": vehicle.category_id,
            "brandId": vehicle.brand_id,
            "cityId": vehicle.city_id,
            "model": "Second Car",
            "year": 2025,
            "registrationNumber": "TN-SECOND-2",
            "transmission": "MANUAL",
            "fuelType": "PETROL",
            "seatingCapacity": 4,
            "pricePerHour": 50,
            "pricePerDay": 1000,
        },
    )
    assert response.status_code == 201


async def test_analytics_requires_toggle_enabled(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)  # everything off
    vehicle = await make_vehicle(db_session)
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    response = await client.get("/api/v1/rental-partners/me/analytics")
    assert response.status_code == 403


async def test_analytics_requires_plan_feature_even_with_active_subscription(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.FLEET_ANALYTICS)
    vehicle = await make_vehicle(db_session)
    plan = await _make_plan(db_session, features={"support": "email"})  # no analytics feature
    await _make_active_subscription(db_session, vehicle.rental_partner_id, plan)
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    response = await client.get("/api/v1/rental-partners/me/analytics")
    assert response.status_code == 403


async def test_analytics_returns_data_when_fully_entitled(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.FLEET_ANALYTICS)
    vehicle = await make_vehicle(db_session)
    plan = await _make_plan(db_session, features={"analytics": True})
    await _make_active_subscription(db_session, vehicle.rental_partner_id, plan)
    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)

    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    response = await client.get("/api/v1/rental-partners/me/analytics")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["vehicleCount"] == 1
    assert "utilizationPercent" in body
    assert "topVehicles" in body
    assert "categoryDemand" in body
