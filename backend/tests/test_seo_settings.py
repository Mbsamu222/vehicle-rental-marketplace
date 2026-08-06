"""Admin-editable SEO overrides.

The behaviour that matters: an override is *partial*. Setting only a title must
not blank the description, and deleting the row must restore the code default.
"""

import pytest
from sqlalchemy import select

from app.db.models import SeoSetting
from tests.factories import make_vehicle

pytestmark = pytest.mark.asyncio


async def test_upsert_creates_then_updates_same_path(db_session):
    db_session.add(SeoSetting(path="/faq", title="Original"))
    await db_session.commit()

    row = (await db_session.execute(select(SeoSetting).where(SeoSetting.path == "/faq"))).scalar_one()
    row.title = "Updated"
    await db_session.commit()

    rows = (await db_session.execute(select(SeoSetting).where(SeoSetting.path == "/faq"))).scalars().all()
    assert len(rows) == 1, "a path must never accumulate duplicate rows"
    assert rows[0].title == "Updated"


async def test_partial_override_leaves_other_fields_null(db_session):
    """Title-only override: description stays NULL so the site falls back."""
    db_session.add(SeoSetting(path="/about", title="Custom title only"))
    await db_session.commit()

    row = (await db_session.execute(select(SeoSetting).where(SeoSetting.path == "/about"))).scalar_one()
    assert row.title == "Custom title only"
    assert row.description is None
    assert row.keywords is None
    assert row.no_index is False


async def test_no_index_flag_can_pull_a_page_from_the_index(db_session):
    db_session.add(SeoSetting(path="/careers", no_index=True))
    await db_session.commit()
    row = (await db_session.execute(select(SeoSetting).where(SeoSetting.path == "/careers"))).scalar_one()
    assert row.no_index is True


async def test_vehicle_seo_defaults_to_null(db_session):
    """A new listing carries no override, so the page derives its own metadata."""
    vehicle = await make_vehicle(db_session)
    assert vehicle.seo_title is None
    assert vehicle.seo_description is None


async def test_vehicle_seo_can_be_overridden_and_cleared(db_session):
    vehicle = await make_vehicle(db_session)

    vehicle.seo_title = "Rent a Swift in Chennai from Rs.1800/day"
    vehicle.seo_description = "Hand-written description for this listing."
    await db_session.commit()
    await db_session.refresh(vehicle)
    assert vehicle.seo_title.startswith("Rent a Swift")

    # Clearing reverts to the derived default.
    vehicle.seo_title = None
    vehicle.seo_description = None
    await db_session.commit()
    await db_session.refresh(vehicle)
    assert vehicle.seo_title is None
