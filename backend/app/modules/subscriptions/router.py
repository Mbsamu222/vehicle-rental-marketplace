from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.responses import ApiError, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import SubscriptionStatus, UserType
from app.db.models import PartnerSubscription, RentalPartner, SubscriptionPlan
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.subscriptions import service
from app.modules.subscriptions.schemas import (
    CreateSubscriptionPlanInput,
    RequestSubscriptionInput,
    UpdateSubscriptionPlanInput,
)

router = APIRouter(dependencies=[Depends(get_current_user)])

admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))
partner_only = Depends(require_user_type(UserType.RENTAL_PARTNER))
manage_subscriptions = Depends(require_permission("subscriptions.manage"))


def _serialize_subscription(sub: PartnerSubscription) -> dict:
    return orm_to_dict(sub, extra={"plan": orm_to_dict(sub.plan) if sub.plan is not None else None})


async def _get_owned_partner_or_throw(db: AsyncSession, user_id: str) -> RentalPartner:
    partner = (await db.execute(select(RentalPartner).where(RentalPartner.user_id == user_id))).scalar_one_or_none()
    if partner is None:
        raise ApiError.not_found("Rental partner profile not found. Complete onboarding first.")
    return partner


# ─── Plans ───


@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    stmt = select(SubscriptionPlan).where(SubscriptionPlan.is_active.is_(True)).order_by(SubscriptionPlan.price)
    plans = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(p) for p in plans])


@router.get("/plans/manage", dependencies=[admin_only, manage_subscriptions])
async def admin_list_plans(db: AsyncSession = Depends(get_db)):
    stmt = select(SubscriptionPlan).order_by(SubscriptionPlan.price)
    plans = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(p) for p in plans])


@router.post("/plans", dependencies=[admin_only, manage_subscriptions], status_code=201)
async def create_plan(payload: CreateSubscriptionPlanInput, db: AsyncSession = Depends(get_db)):
    plan = SubscriptionPlan(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        duration_days=payload.durationDays,
        max_vehicles=payload.maxVehicles,
        features=payload.features,
        is_active=payload.isActive if payload.isActive is not None else True,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return success_response(orm_to_dict(plan), 201)


@router.patch("/plans/{id}", dependencies=[admin_only, manage_subscriptions])
async def update_plan(id: UuidPath, payload: UpdateSubscriptionPlanInput, db: AsyncSession = Depends(get_db)):
    plan = await db.get(SubscriptionPlan, id)
    if plan is None:
        raise ApiError.not_found()
    field_map = {"durationDays": "duration_days", "maxVehicles": "max_vehicles", "isActive": "is_active"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(plan)
    return success_response(orm_to_dict(plan))


@router.delete("/plans/{id}", dependencies=[admin_only, manage_subscriptions])
async def delete_plan(id: UuidPath, db: AsyncSession = Depends(get_db)):
    plan = await db.get(SubscriptionPlan, id)
    if plan is None:
        raise ApiError.not_found()
    plan.is_active = False
    await db.commit()
    return success_response({"message": "Subscription plan deactivated"})


# ─── Partner self-service ───


@router.post("/mine", dependencies=[partner_only], status_code=201)
async def request_subscription(
    payload: RequestSubscriptionInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    partner = await _get_owned_partner_or_throw(db, user.id)
    subscription = await service.request_subscription(db, partner.id, payload.planId)
    return success_response(_serialize_subscription(subscription), 201)


@router.get("/mine", dependencies=[partner_only])
async def get_my_subscription(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    partner = await _get_owned_partner_or_throw(db, user.id)
    subscription = await service.get_latest_subscription(db, partner.id)
    return success_response(_serialize_subscription(subscription) if subscription is not None else None)


# ─── Admin oversight ───


@router.get("/pending", dependencies=[admin_only, manage_subscriptions])
async def list_pending_subscriptions(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(PartnerSubscription)
        .where(PartnerSubscription.status == SubscriptionStatus.PENDING)
        .options(selectinload(PartnerSubscription.plan), selectinload(PartnerSubscription.rental_partner))
        .order_by(PartnerSubscription.started_at.asc())
    )
    subscriptions = (await db.execute(stmt)).scalars().all()
    return success_response(
        [
            orm_to_dict(
                s,
                extra={
                    "plan": orm_to_dict(s.plan) if s.plan is not None else None,
                    "rentalPartner": orm_to_dict(s.rental_partner) if s.rental_partner is not None else None,
                },
            )
            for s in subscriptions
        ]
    )


@router.patch("/{id}/confirm", dependencies=[admin_only, manage_subscriptions])
async def confirm_subscription(id: UuidPath, db: AsyncSession = Depends(get_db)):
    subscription = await service.confirm_subscription(db, id)
    return success_response(_serialize_subscription(subscription))
