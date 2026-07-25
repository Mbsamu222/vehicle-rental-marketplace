from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import ApiError
from app.db.enums import BookingStatus
from app.db.models import Booking, RentalPartner, Review, ReviewImage, Vehicle


async def create_review(
    db: AsyncSession,
    *,
    customer_id: str,
    booking_id: str,
    vehicle_rating: int,
    partner_rating: int,
    comment: str | None = None,
    image_urls: list[str] | None = None,
) -> Review:
    booking = await db.get(Booking, booking_id)
    if booking is None:
        raise ApiError.not_found("Booking not found")
    if booking.customer_id != customer_id:
        raise ApiError.forbidden()
    if booking.status != BookingStatus.COMPLETED:
        raise ApiError.bad_request("You can only review completed rentals")

    existing = (await db.execute(select(Review).where(Review.booking_id == booking.id))).scalar_one_or_none()
    if existing is not None:
        raise ApiError.conflict("You have already reviewed this booking")

    review = Review(
        booking_id=booking.id,
        customer_id=customer_id,
        vehicle_id=booking.vehicle_id,
        rental_partner_id=booking.rental_partner_id,
        vehicle_rating=vehicle_rating,
        partner_rating=partner_rating,
        comment=comment,
    )
    db.add(review)
    await db.flush()

    if image_urls:
        db.add_all([ReviewImage(review_id=review.id, url=url) for url in image_urls])

    await _recompute_vehicle_rating(db, booking.vehicle_id)
    await _recompute_partner_rating(db, booking.rental_partner_id)

    await db.commit()
    await db.refresh(review, attribute_names=["images"])
    return review


async def _recompute_vehicle_rating(db: AsyncSession, vehicle_id: str) -> None:
    avg_rating, count = (
        await db.execute(select(func.avg(Review.vehicle_rating), func.count()).where(Review.vehicle_id == vehicle_id))
    ).one()
    vehicle = await db.get(Vehicle, vehicle_id)
    vehicle.average_rating = Decimal(str(round(float(avg_rating), 2))) if avg_rating is not None else Decimal("0")
    vehicle.total_reviews = count


async def _recompute_partner_rating(db: AsyncSession, rental_partner_id: str) -> None:
    avg_rating, count = (
        await db.execute(
            select(func.avg(Review.partner_rating), func.count()).where(Review.rental_partner_id == rental_partner_id)
        )
    ).one()
    partner = await db.get(RentalPartner, rental_partner_id)
    partner.average_rating = Decimal(str(round(float(avg_rating), 2))) if avg_rating is not None else Decimal("0")
    partner.total_reviews = count
