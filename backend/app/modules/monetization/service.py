from typing import Literal

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import ApiError
from app.db.enums import MonetizationFeatureKey
from app.db.models import MonetizationFeature


class PayoutFeeConfig(BaseModel):
    type: Literal["FLAT", "PERCENTAGE"] = "PERCENTAGE"
    value: float = Field(ge=0, default=0)
    cap: float | None = Field(default=None, ge=0)


class ServiceFeeConfig(BaseModel):
    type: Literal["FLAT", "PERCENTAGE"] = "FLAT"
    value: float = Field(ge=0, default=0)
    cap: float | None = Field(default=None, ge=0)


class ExtraDriverFeeConfig(BaseModel):
    perDriverFlat: float = Field(ge=0, default=0)


class YoungDriverFeeConfig(BaseModel):
    flat: float = Field(ge=0, default=0)


class CancellationFeeTier(BaseModel):
    hoursBeforePickup: int = Field(ge=0)
    feePercentage: float = Field(ge=0, le=100)


class CancellationFeeConfig(BaseModel):
    # Tiers should be ordered by descending `hoursBeforePickup`; the first tier
    # whose threshold the cancellation lead time still clears applies. E.g.
    # [{hoursBeforePickup: 48, feePercentage: 0}, {hoursBeforePickup: 24, feePercentage: 25},
    #  {hoursBeforePickup: 0, feePercentage: 50}] -> free before 48h, 25% between 24-48h, 50% under 24h.
    tiers: list[CancellationFeeTier] = Field(default_factory=list)


class LateReturnFeeConfig(BaseModel):
    gracePeriodMinutes: int = Field(ge=0, default=30)
    perHourAmount: float = Field(ge=0, default=0)
    maxAmount: float | None = Field(default=None, ge=0)


# Populated incrementally as each monetization phase lands its own config shape
# (e.g. CONFIG_SCHEMAS[MonetizationFeatureKey.SERVICE_FEE] = ServiceFeeConfig).
# Keys with no entry here accept any JSON object as config.
CONFIG_SCHEMAS: dict[MonetizationFeatureKey, type[BaseModel]] = {
    MonetizationFeatureKey.PAYOUT_FEE: PayoutFeeConfig,
    MonetizationFeatureKey.SERVICE_FEE: ServiceFeeConfig,
    MonetizationFeatureKey.EXTRA_DRIVER_FEE: ExtraDriverFeeConfig,
    MonetizationFeatureKey.YOUNG_DRIVER_FEE: YoungDriverFeeConfig,
    MonetizationFeatureKey.CANCELLATION_FEE: CancellationFeeConfig,
    MonetizationFeatureKey.LATE_RETURN_FEE: LateReturnFeeConfig,
}


async def list_features(db: AsyncSession) -> list[MonetizationFeature]:
    stmt = select(MonetizationFeature).order_by(MonetizationFeature.key)
    return list((await db.execute(stmt)).scalars().all())


async def get_feature(db: AsyncSession, key: MonetizationFeatureKey) -> MonetizationFeature:
    stmt = select(MonetizationFeature).where(MonetizationFeature.key == key)
    feature = (await db.execute(stmt)).scalar_one_or_none()
    if feature is None:
        raise ApiError.not_found(f"Monetization feature '{key.value}' is not registered")
    return feature


async def is_enabled(db: AsyncSession, key: MonetizationFeatureKey) -> bool:
    """Small helper other modules (bookings, vehicles, payouts, ...) import to
    check a toggle before applying any fee/behavior change. Every mechanism
    must call this before doing anything — when the row is disabled, behavior
    stays byte-identical to before this feature existed."""
    feature = await get_feature(db, key)
    return feature.is_enabled


async def get_config(db: AsyncSession, key: MonetizationFeatureKey) -> dict:
    feature = await get_feature(db, key)
    return feature.config or {}


async def update_feature(
    db: AsyncSession,
    key: MonetizationFeatureKey,
    *,
    is_enabled: bool | None,
    config: dict | None,
    actor_id: str,
) -> MonetizationFeature:
    feature = await get_feature(db, key)

    if config is not None:
        schema = CONFIG_SCHEMAS.get(key)
        feature.config = schema.model_validate(config).model_dump() if schema else config
    if is_enabled is not None:
        feature.is_enabled = is_enabled
    feature.updated_by_id = actor_id

    await db.commit()
    await db.refresh(feature)
    return feature
