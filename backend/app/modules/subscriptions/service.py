from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.responses import ApiError
from app.db.enums import SubscriptionStatus
from app.db.models import PartnerSubscription, SubscriptionPlan


async def get_active_subscription(db: AsyncSession, rental_partner_id: str) -> PartnerSubscription | None:
    """The one shared query every module that cares about a partner's plan
    (commission override, vehicle-count cap, analytics gate) uses — most recent
    ACTIVE, unexpired subscription with its plan eagerly loaded."""
    stmt = (
        select(PartnerSubscription)
        .where(
            PartnerSubscription.rental_partner_id == rental_partner_id,
            PartnerSubscription.status == SubscriptionStatus.ACTIVE,
            PartnerSubscription.expires_at > datetime.now(timezone.utc),
        )
        .options(selectinload(PartnerSubscription.plan))
        .order_by(PartnerSubscription.expires_at.desc())
    )
    return (await db.execute(stmt)).scalars().first()


async def get_latest_subscription(db: AsyncSession, rental_partner_id: str) -> PartnerSubscription | None:
    stmt = (
        select(PartnerSubscription)
        .where(PartnerSubscription.rental_partner_id == rental_partner_id)
        .options(selectinload(PartnerSubscription.plan))
        .order_by(PartnerSubscription.started_at.desc())
    )
    return (await db.execute(stmt)).scalars().first()


async def request_subscription(db: AsyncSession, rental_partner_id: str, plan_id: str) -> PartnerSubscription:
    plan = await db.get(SubscriptionPlan, plan_id)
    if plan is None or not plan.is_active:
        raise ApiError.not_found("Subscription plan not found")

    existing = await get_latest_subscription(db, rental_partner_id)
    if existing is not None and existing.status in (SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE):
        raise ApiError.bad_request("You already have a pending or active subscription")

    subscription = PartnerSubscription(
        rental_partner_id=rental_partner_id,
        plan_id=plan_id,
        status=SubscriptionStatus.PENDING,
        expires_at=datetime.now(timezone.utc),  # placeholder until confirmed; set for real on confirmation
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription, attribute_names=["plan"])
    return subscription


async def confirm_subscription(db: AsyncSession, subscription_id: str) -> PartnerSubscription:
    stmt = (
        select(PartnerSubscription).where(PartnerSubscription.id == subscription_id).options(selectinload(PartnerSubscription.plan))
    )
    subscription = (await db.execute(stmt)).scalar_one_or_none()
    if subscription is None:
        raise ApiError.not_found("Subscription request not found")
    if subscription.status != SubscriptionStatus.PENDING:
        raise ApiError.bad_request("Only pending subscription requests can be confirmed")

    now = datetime.now(timezone.utc)
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.started_at = now
    subscription.expires_at = now + timedelta(days=subscription.plan.duration_days)

    await db.commit()
    await db.refresh(subscription, attribute_names=["plan"])
    return subscription
