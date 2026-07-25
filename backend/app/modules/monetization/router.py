from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import success_response
from app.db.session import get_db
from app.modules.monetization import service

router = APIRouter()


@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    """Public, unauthenticated: just the enabled/disabled flag per feature — no
    rates, tiers, or other config. Anonymous visitors on public-site need this
    to decide whether to render boosted-listing badges, sponsored content, etc.
    before they've logged in at all."""
    features = await service.list_features(db)
    return success_response({f.key.value: f.is_enabled for f in features})
