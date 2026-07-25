from datetime import datetime, timedelta, timezone

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import MonetizationFeatureKey, UserType
from app.db.models import MonetizationFeature
from app.deps.auth import AuthUser
from tests.conftest import login_as
from tests.factories import make_vehicle


async def _seed_features(db_session: AsyncSession) -> None:
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=False))
    await db_session.commit()


async def _make_ordered_pair(db_session: AsyncSession):
    # SQLite's CURRENT_TIMESTAMP is second-granular, so two inserts in the same
    # test can tie on `created_at` — set timestamps explicitly for a
    # deterministic "newest first" default order instead of relying on wall clock.
    older = await make_vehicle(db_session)
    newer = await make_vehicle(db_session)
    older.created_at = datetime.now(timezone.utc) - timedelta(hours=1)
    newer.created_at = datetime.now(timezone.utc)
    await db_session.commit()
    return older, newer


async def test_boosted_vehicle_does_not_change_order_while_toggle_off(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    older, newer = await _make_ordered_pair(db_session)

    login_as(AuthUser(id="admin-1", user_type=UserType.SUPER_ADMIN, permissions=[]))
    boost = await client.post(f"/api/v1/vehicles/{older.id}/boost", json={"days": 7, "amountCharged": 500})
    assert boost.status_code == 400  # BOOSTED_LISTINGS still disabled

    results = await client.get("/api/v1/vehicles/search")
    ids = [v["id"] for v in results.json()["data"]]
    assert ids == [newer.id, older.id]  # default order: newest first, unaffected by the failed boost


async def test_boosted_vehicle_ranks_first_once_toggle_enabled(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    older, newer = await _make_ordered_pair(db_session)

    login_as(AuthUser(id="admin-1", user_type=UserType.SUPER_ADMIN, permissions=[]))
    await client.patch("/api/v1/admin/monetization/features/BOOSTED_LISTINGS", json={"isEnabled": True})

    boost = await client.post(f"/api/v1/vehicles/{older.id}/boost", json={"days": 7, "amountCharged": 500})
    assert boost.status_code == 201
    assert boost.json()["data"]["isFeatured"] is True

    results = await client.get("/api/v1/vehicles/search")
    ids = [v["id"] for v in results.json()["data"]]
    assert ids == [older.id, newer.id]  # boosted vehicle now ranks first despite being older
