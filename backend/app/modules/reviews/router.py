from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import UserType
from app.db.models import Review, ReviewReply, ReviewReport
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.reviews import service
from app.modules.reviews.schemas import CreateReviewInput, ReplyInput, ReportInput

router = APIRouter()

customer_only = Depends(require_user_type(UserType.CUSTOMER))
reply_roles = Depends(require_user_type(UserType.RENTAL_PARTNER, UserType.ADMIN, UserType.SUPER_ADMIN))


def _serialize_review(review: Review) -> dict:
    return orm_to_dict(
        review,
        extra={
            "customer": sanitize_user(review.customer) if review.customer is not None else None,
            "images": [orm_to_dict(i) for i in review.images],
            "replies": [orm_to_dict(r) for r in review.replies],
        },
    )


@router.get("/vehicle/{vehicleId}")
async def list_by_vehicle(
    vehicleId: UuidPath, pagination: Pagination = Depends(get_pagination()), db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Review)
        .where(Review.vehicle_id == vehicleId)
        .options(selectinload(Review.customer), selectinload(Review.images), selectinload(Review.replies))
        .order_by(Review.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    reviews = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(select(func.count()).select_from(Review).where(Review.vehicle_id == vehicleId))
    ).scalar_one()
    return success_response(
        [_serialize_review(r) for r in reviews], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.get("/partner/{rentalPartnerId}")
async def list_by_partner(
    rentalPartnerId: UuidPath, pagination: Pagination = Depends(get_pagination()), db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Review)
        .where(Review.rental_partner_id == rentalPartnerId)
        .options(selectinload(Review.customer), selectinload(Review.images), selectinload(Review.replies))
        .order_by(Review.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    reviews = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(select(func.count()).select_from(Review).where(Review.rental_partner_id == rentalPartnerId))
    ).scalar_one()
    return success_response(
        [_serialize_review(r) for r in reviews], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.post("", dependencies=[customer_only], status_code=201)
async def create(payload: CreateReviewInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    review = await service.create_review(
        db,
        customer_id=user.id,
        booking_id=payload.bookingId,
        vehicle_rating=payload.vehicleRating,
        partner_rating=payload.partnerRating,
        comment=payload.comment,
        image_urls=payload.imageUrls,
    )
    return success_response(orm_to_dict(review, extra={"images": [orm_to_dict(i) for i in review.images]}), 201)


@router.post("/{id}/reply", dependencies=[reply_roles], status_code=201)
async def reply(id: UuidPath, payload: ReplyInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Review).where(Review.id == id).options(selectinload(Review.rental_partner))
    review = (await db.execute(stmt)).scalar_one_or_none()
    if review is None:
        raise ApiError.not_found("Review not found")

    is_owning_partner = review.rental_partner.user_id == user.id
    is_admin = user.user_type in (UserType.ADMIN, UserType.SUPER_ADMIN)
    if not is_owning_partner and not is_admin:
        raise ApiError.forbidden()

    created = ReviewReply(review_id=review.id, author_id=user.id, message=payload.message)
    db.add(created)
    await db.commit()
    await db.refresh(created)
    return success_response(orm_to_dict(created), 201)


@router.post("/{id}/report", dependencies=[Depends(get_current_user)], status_code=201)
async def report(id: UuidPath, payload: ReportInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    review = await db.get(Review, id)
    if review is None:
        raise ApiError.not_found("Review not found")

    created = ReviewReport(review_id=review.id, reported_by_id=user.id, reason=payload.reason)
    db.add(created)
    review.is_reported = True
    await db.commit()
    await db.refresh(created)
    return success_response(orm_to_dict(created), 201)
