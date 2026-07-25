"""Smoke test for the Phase 0 harness itself, plus first real coverage of the
Phase 1 monetization toggle registry: every feature ships disabled, and only
an authorized admin can flip one."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import MonetizationFeatureKey, UserType
from app.db.models import MonetizationFeature
from app.deps.auth import AuthUser
from tests.conftest import login_as


async def _seed_features(db_session: AsyncSession) -> None:
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=False))
    await db_session.commit()


async def test_health_check(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_list_features_requires_admin(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    login_as(AuthUser(id="customer-1", user_type=UserType.CUSTOMER, permissions=[]))

    response = await client.get("/api/v1/admin/monetization/features")

    assert response.status_code == 403


async def test_super_admin_can_toggle_feature_on(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    login_as(AuthUser(id="admin-1", user_type=UserType.SUPER_ADMIN, permissions=[]))

    list_response = await client.get("/api/v1/admin/monetization/features")
    assert list_response.status_code == 200
    features = list_response.json()["data"]
    assert len(features) == len(list(MonetizationFeatureKey))
    assert all(f["isEnabled"] is False for f in features)

    toggle_response = await client.patch(
        "/api/v1/admin/monetization/features/BOOKING_COMMISSION",
        json={"isEnabled": True, "config": {"note": "test"}},
    )
    assert toggle_response.status_code == 200
    body = toggle_response.json()["data"]
    assert body["isEnabled"] is True
    assert body["config"] == {"note": "test"}
    assert body["updatedById"] == "admin-1"

    refreshed = (
        await db_session.execute(select(MonetizationFeature).where(MonetizationFeature.key == MonetizationFeatureKey.BOOKING_COMMISSION))
    ).scalar_one()
    assert refreshed.is_enabled is True


async def test_public_status_endpoint_requires_no_auth_and_reflects_toggles(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    feature = (
        await db_session.execute(select(MonetizationFeature).where(MonetizationFeature.key == MonetizationFeatureKey.BOOSTED_LISTINGS))
    ).scalar_one()
    feature.is_enabled = True
    await db_session.commit()

    # No login_as() call — this must work for an anonymous visitor.
    response = await client.get("/api/v1/monetization/status")

    assert response.status_code == 200
    body = response.json()["data"]
    assert len(body) == len(list(MonetizationFeatureKey))
    assert body["BOOSTED_LISTINGS"] is True
    assert body["SERVICE_FEE"] is False
    # Only booleans — no rates/tiers/config leak through the public endpoint.
    assert all(isinstance(v, bool) for v in body.values())
