from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import AffiliateCategory, MonetizationFeatureKey
from app.db.models import AdSlot, AffiliatePartner, MonetizationFeature


async def _enable(db_session: AsyncSession, key: MonetizationFeatureKey) -> None:
    feature = (await db_session.execute(select(MonetizationFeature).where(MonetizationFeature.key == key))).scalar_one()
    feature.is_enabled = True
    await db_session.commit()


async def _seed_features(db_session: AsyncSession) -> None:
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=False))
    await db_session.commit()


async def test_ad_slots_hidden_until_toggle_enabled(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    db_session.add(AdSlot(title="Sponsor A", image_url="https://example.com/a.png"))
    await db_session.commit()

    disabled = await client.get("/api/v1/catalog/ad-slots")
    assert disabled.json()["data"] == []

    await _enable(db_session, MonetizationFeatureKey.SPONSORED_PLACEMENTS)

    enabled = await client.get("/api/v1/catalog/ad-slots")
    assert len(enabled.json()["data"]) == 1
    assert enabled.json()["data"][0]["title"] == "Sponsor A"


async def test_affiliate_partners_hidden_until_toggle_enabled(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    db_session.add(
        AffiliatePartner(name="DriveSafe", category=AffiliateCategory.INSURANCE, referral_url="https://example.com")
    )
    await db_session.commit()

    disabled = await client.get("/api/v1/catalog/affiliate-partners")
    assert disabled.json()["data"] == []

    await _enable(db_session, MonetizationFeatureKey.AFFILIATE_PROGRAM)

    enabled = await client.get("/api/v1/catalog/affiliate-partners")
    assert len(enabled.json()["data"]) == 1
    assert enabled.json()["data"][0]["name"] == "DriveSafe"
