from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.ids import UuidPath
from app.core.responses import ApiError, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import MonetizationFeatureKey, UserType
from app.db.models import AdSlot, AffiliatePartner, City, Country, VehicleBrand, VehicleCategory
from app.db.session import get_db
from app.deps.rbac import require_user_type
from app.modules.catalog.schemas import (
    CreateBrandInput,
    CreateCategoryInput,
    CreateCityInput,
    CreateCountryInput,
    UpdateBrandInput,
    UpdateCategoryInput,
    UpdateCityInput,
    UpdateCountryInput,
)
from app.modules.monetization import service as monetization_service

router = APIRouter()

admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))


def _serialize_city(city: City) -> dict:
    extra = {"country": orm_to_dict(city.country)} if city.country is not None else {}
    return orm_to_dict(city, extra=extra)


# ─── Countries ───


@router.get("/countries")
async def list_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Country).where(Country.is_active.is_(True)).order_by(Country.name))
    countries = result.scalars().all()
    return success_response([orm_to_dict(c) for c in countries])


@router.get("/admin/countries", dependencies=[admin_only])
async def admin_list_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Country).order_by(Country.name))
    countries = result.scalars().all()
    return success_response([orm_to_dict(c) for c in countries])


@router.post("/countries", dependencies=[admin_only], status_code=201)
async def create_country(payload: CreateCountryInput, db: AsyncSession = Depends(get_db)):
    country = Country(name=payload.name, code=payload.code)
    db.add(country)
    await db.commit()
    await db.refresh(country)
    return success_response(orm_to_dict(country), 201)


@router.patch("/countries/{id}", dependencies=[admin_only])
async def update_country(id: UuidPath, payload: UpdateCountryInput, db: AsyncSession = Depends(get_db)):
    country = await db.get(Country, id)
    if country is None:
        raise ApiError.not_found()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(country, "is_active" if field == "isActive" else field, value)
    await db.commit()
    await db.refresh(country)
    return success_response(orm_to_dict(country))


@router.delete("/countries/{id}", dependencies=[admin_only])
async def delete_country(id: UuidPath, db: AsyncSession = Depends(get_db)):
    country = await db.get(Country, id)
    if country is None:
        raise ApiError.not_found()
    country.is_active = False
    await db.commit()
    return success_response({"message": "Country deactivated"})


# ─── Cities ───


@router.get("/cities")
async def list_cities(
    countryId: str | None = Query(default=None),
    popular: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(City).where(City.is_active.is_(True)).options(selectinload(City.country)).order_by(City.name)
    if countryId:
        stmt = stmt.where(City.country_id == countryId)
    if popular:
        stmt = stmt.where(City.is_popular.is_(True))
    result = await db.execute(stmt)
    return success_response([_serialize_city(c) for c in result.scalars().all()])


@router.get("/admin/cities", dependencies=[admin_only])
async def admin_list_cities(
    countryId: str | None = Query(default=None),
    popular: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(City).options(selectinload(City.country)).order_by(City.name)
    if countryId:
        stmt = stmt.where(City.country_id == countryId)
    if popular:
        stmt = stmt.where(City.is_popular.is_(True))
    result = await db.execute(stmt)
    return success_response([_serialize_city(c) for c in result.scalars().all()])


@router.post("/cities", dependencies=[admin_only], status_code=201)
async def create_city(payload: CreateCityInput, db: AsyncSession = Depends(get_db)):
    city = City(
        name=payload.name,
        country_id=payload.countryId,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_popular=payload.isPopular if payload.isPopular is not None else False,
        image_url=payload.imageUrl,
    )
    db.add(city)
    await db.commit()
    await db.refresh(city, attribute_names=["country"])
    return success_response(_serialize_city(city), 201)


@router.patch("/cities/{id}", dependencies=[admin_only])
async def update_city(id: UuidPath, payload: UpdateCityInput, db: AsyncSession = Depends(get_db)):
    city = await db.get(City, id, options=[selectinload(City.country)])
    if city is None:
        raise ApiError.not_found()
    field_map = {
        "countryId": "country_id",
        "isPopular": "is_popular",
        "imageUrl": "image_url",
        "isActive": "is_active",
    }
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(city, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(city, attribute_names=["country"])
    return success_response(_serialize_city(city))


@router.delete("/cities/{id}", dependencies=[admin_only])
async def delete_city(id: UuidPath, db: AsyncSession = Depends(get_db)):
    city = await db.get(City, id)
    if city is None:
        raise ApiError.not_found()
    city.is_active = False
    await db.commit()
    return success_response({"message": "City deactivated"})


# ─── Vehicle categories ───


@router.get("/vehicle-categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VehicleCategory).where(VehicleCategory.is_active.is_(True)).order_by(VehicleCategory.name))
    return success_response([orm_to_dict(c) for c in result.scalars().all()])


@router.get("/admin/vehicle-categories", dependencies=[admin_only])
async def admin_list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VehicleCategory).order_by(VehicleCategory.name))
    return success_response([orm_to_dict(c) for c in result.scalars().all()])


@router.post("/vehicle-categories", dependencies=[admin_only], status_code=201)
async def create_category(payload: CreateCategoryInput, db: AsyncSession = Depends(get_db)):
    category = VehicleCategory(name=payload.name, slug=payload.slug, icon_url=payload.iconUrl)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return success_response(orm_to_dict(category), 201)


@router.patch("/vehicle-categories/{id}", dependencies=[admin_only])
async def update_category(id: UuidPath, payload: UpdateCategoryInput, db: AsyncSession = Depends(get_db)):
    category = await db.get(VehicleCategory, id)
    if category is None:
        raise ApiError.not_found()
    field_map = {"iconUrl": "icon_url", "isActive": "is_active"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(category)
    return success_response(orm_to_dict(category))


@router.delete("/vehicle-categories/{id}", dependencies=[admin_only])
async def delete_category(id: UuidPath, db: AsyncSession = Depends(get_db)):
    category = await db.get(VehicleCategory, id)
    if category is None:
        raise ApiError.not_found()
    category.is_active = False
    await db.commit()
    return success_response({"message": "Vehicle category deactivated"})


# ─── Vehicle brands ───


@router.get("/vehicle-brands")
async def list_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VehicleBrand).where(VehicleBrand.is_active.is_(True)).order_by(VehicleBrand.name))
    return success_response([orm_to_dict(b) for b in result.scalars().all()])


@router.get("/admin/vehicle-brands", dependencies=[admin_only])
async def admin_list_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VehicleBrand).order_by(VehicleBrand.name))
    return success_response([orm_to_dict(b) for b in result.scalars().all()])


@router.post("/vehicle-brands", dependencies=[admin_only], status_code=201)
async def create_brand(payload: CreateBrandInput, db: AsyncSession = Depends(get_db)):
    brand = VehicleBrand(name=payload.name, logo_url=payload.logoUrl)
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return success_response(orm_to_dict(brand), 201)


@router.patch("/vehicle-brands/{id}", dependencies=[admin_only])
async def update_brand(id: UuidPath, payload: UpdateBrandInput, db: AsyncSession = Depends(get_db)):
    brand = await db.get(VehicleBrand, id)
    if brand is None:
        raise ApiError.not_found()
    field_map = {"logoUrl": "logo_url", "isActive": "is_active"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(brand, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(brand)
    return success_response(orm_to_dict(brand))


@router.delete("/vehicle-brands/{id}", dependencies=[admin_only])
async def delete_brand(id: UuidPath, db: AsyncSession = Depends(get_db)):
    brand = await db.get(VehicleBrand, id)
    if brand is None:
        raise ApiError.not_found()
    brand.is_active = False
    await db.commit()
    return success_response({"message": "Vehicle brand deactivated"})


# ─── Ad slots / affiliate partners (public reads) ───
# Gated server-side on their monetization toggle — return [] when disabled so
# the frontend doesn't need its own gating logic and can't accidentally show
# paid placements the admin hasn't turned on.


@router.get("/ad-slots")
async def list_ad_slots(db: AsyncSession = Depends(get_db)):
    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.SPONSORED_PLACEMENTS):
        return success_response([])
    stmt = select(AdSlot).where(AdSlot.is_active.is_(True)).order_by(AdSlot.sort_order)
    return success_response([orm_to_dict(s) for s in (await db.execute(stmt)).scalars().all()])


@router.get("/affiliate-partners")
async def list_affiliate_partners(db: AsyncSession = Depends(get_db)):
    if not await monetization_service.is_enabled(db, MonetizationFeatureKey.AFFILIATE_PROGRAM):
        return success_response([])
    stmt = select(AffiliatePartner).where(AffiliatePartner.is_active.is_(True)).order_by(AffiliatePartner.sort_order)
    return success_response([orm_to_dict(p) for p in (await db.execute(stmt)).scalars().all()])
