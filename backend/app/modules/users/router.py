from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from fastapi import APIRouter, Depends
from app.core.ids import UuidPath
from app.core.responses import ApiError, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import BookingStatus, UserType
from app.db.models import Booking, DrivingLicense, SavedLocation, User, Vehicle, Wallet, WishlistItem
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.users.schemas import AddDrivingLicenseInput, AddSavedLocationInput, UpdateProfileInput

router = APIRouter(dependencies=[Depends(get_current_user)])

ACTIVE_BOOKING_STATUSES = (
    BookingStatus.CONFIRMED,
    BookingStatus.APPROVED,
    BookingStatus.VEHICLE_READY,
    BookingStatus.PICKED_UP,
    BookingStatus.ACTIVE,
    BookingStatus.RETURNING,
)


@router.patch("/me")
async def update_profile(
    payload: UpdateProfileInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    db_user = await db.get(User, user.id)
    if db_user is None:
        raise ApiError.not_found("User not found")
    field_map = {"avatarUrl": "avatar_url", "firstName": "first_name", "lastName": "last_name"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_user, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(db_user)
    return success_response(sanitize_user(db_user))


@router.get("/me/dashboard", dependencies=[Depends(require_user_type(UserType.CUSTOMER))])
async def get_dashboard(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    active_bookings = (
        await db.execute(
            select(func.count())
            .select_from(Booking)
            .where(Booking.customer_id == user.id, Booking.status.in_(ACTIVE_BOOKING_STATUSES))
        )
    ).scalar_one()
    completed_bookings = (
        await db.execute(
            select(func.count())
            .select_from(Booking)
            .where(Booking.customer_id == user.id, Booking.status == BookingStatus.COMPLETED)
        )
    ).scalar_one()
    wishlist_count = (
        await db.execute(select(func.count()).select_from(WishlistItem).where(WishlistItem.user_id == user.id))
    ).scalar_one()
    wallet = (await db.execute(select(Wallet).where(Wallet.user_id == user.id))).scalar_one_or_none()

    return success_response(
        {
            "activeBookings": active_bookings,
            "completedBookings": completed_bookings,
            "wishlistCount": wishlist_count,
            "walletBalance": wallet.balance if wallet is not None else 0,
        }
    )


@router.get("/me/driving-licenses")
async def list_driving_licenses(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DrivingLicense).where(DrivingLicense.user_id == user.id).order_by(DrivingLicense.created_at.desc())
    )
    return success_response([orm_to_dict(license_) for license_ in result.scalars().all()])


@router.post("/me/driving-licenses", status_code=201)
async def add_driving_license(
    payload: AddDrivingLicenseInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    license_ = DrivingLicense(
        user_id=user.id,
        license_number=payload.licenseNumber,
        front_image_url=payload.frontImageUrl,
        back_image_url=payload.backImageUrl,
        expiry_date=payload.expiryDate,
    )
    db.add(license_)
    await db.commit()
    await db.refresh(license_)
    return success_response(orm_to_dict(license_), 201)


@router.get("/me/wishlist")
async def list_wishlist(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(WishlistItem)
        .where(WishlistItem.user_id == user.id)
        .options(
            selectinload(WishlistItem.vehicle).selectinload(Vehicle.images),
            selectinload(WishlistItem.vehicle).selectinload(Vehicle.brand),
            selectinload(WishlistItem.vehicle).selectinload(Vehicle.category),
        )
        .order_by(WishlistItem.created_at.desc())
    )
    items = (await db.execute(stmt)).scalars().all()
    return success_response(
        [
            {
                "vehicleId": item.vehicle_id,
                "vehicle": orm_to_dict(
                    item.vehicle,
                    extra={
                        "images": [orm_to_dict(i) for i in item.vehicle.images],
                        "brand": orm_to_dict(item.vehicle.brand),
                        "category": orm_to_dict(item.vehicle.category),
                    },
                ),
            }
            for item in items
        ]
    )


@router.post("/me/wishlist/{vehicleId}", status_code=201)
async def add_to_wishlist(
    vehicleId: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    existing = await db.get(WishlistItem, {"user_id": user.id, "vehicle_id": vehicleId})
    if existing is None:
        db.add(WishlistItem(user_id=user.id, vehicle_id=vehicleId))
        await db.commit()
        existing = await db.get(WishlistItem, {"user_id": user.id, "vehicle_id": vehicleId})
    return success_response(orm_to_dict(existing), 201)


@router.delete("/me/wishlist/{vehicleId}")
async def remove_from_wishlist(
    vehicleId: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    item = await db.get(WishlistItem, {"user_id": user.id, "vehicle_id": vehicleId})
    if item is not None:
        await db.delete(item)
        await db.commit()
    return success_response({"message": "Removed from wishlist"})


@router.get("/me/saved-locations")
async def list_saved_locations(user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SavedLocation).where(SavedLocation.user_id == user.id).order_by(SavedLocation.created_at.desc())
    )
    return success_response([orm_to_dict(loc) for loc in result.scalars().all()])


@router.post("/me/saved-locations", status_code=201)
async def add_saved_location(
    payload: AddSavedLocationInput, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    location = SavedLocation(
        user_id=user.id,
        city_id=payload.cityId,
        label=payload.label,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return success_response(orm_to_dict(location), 201)


@router.delete("/me/saved-locations/{id}")
async def delete_saved_location(
    id: UuidPath, user: AuthUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    location = await db.get(SavedLocation, id)
    if location is None or location.user_id != user.id:
        raise ApiError.not_found("Saved location not found")
    await db.delete(location)
    await db.commit()
    return success_response({"message": "Deleted"})
