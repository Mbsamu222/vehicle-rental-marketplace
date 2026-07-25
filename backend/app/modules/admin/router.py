from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.firebase import revoke_refresh_tokens, update_user as update_firebase_user
from app.core.ids import UuidPath
from app.core.pagination import Pagination, get_pagination
from app.core.responses import ApiError, pagination_meta, success_response
from app.core.serialize import orm_to_dict
from app.db.enums import (
    AccountStatus,
    AffiliateCategory,
    BlogStatus,
    BookingStatus,
    DrivingLicenseStatus,
    MonetizationFeatureKey,
    PartnerVerificationStatus,
    SupportTicketStatus,
    TransactionType,
    UserType,
    VehicleApprovalStatus,
)
from app.db.models import (
    AdSlot,
    AffiliatePartner,
    AuditLog,
    BlogPost,
    Booking,
    CmsPage,
    DrivingLicense,
    HeroBannerSlide,
    Permission,
    RentalPartner,
    Role,
    RolePermission,
    Setting,
    SupportTicket,
    Transaction,
    User,
    UserRole,
    Vehicle,
)
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.deps.rbac import require_permission, require_user_type
from app.modules.auth.service import sanitize_user
from app.modules.admin.schemas import (
    AssignRoleInput,
    CreateAdSlotInput,
    CreateAffiliatePartnerInput,
    CreateHeroBannerSlideInput,
    CreateRoleInput,
    ReviewDrivingLicenseInput,
    UpdateAdSlotInput,
    UpdateAffiliatePartnerInput,
    UpdateHeroBannerSlideInput,
    UpdateRoleInput,
    UpdateUserStatusInput,
    UpsertBlogPostInput,
    UpsertCmsPageInput,
    UpsertSettingInput,
)
from app.modules.monetization import service as monetization_service
from app.modules.monetization.schemas import UpdateFeatureInput

router = APIRouter()

admin_only = Depends(require_user_type(UserType.ADMIN, UserType.SUPER_ADMIN))


def _serialize_role(role: Role) -> dict:
    """RolePermission is a join table with no id of its own, so the API flattens it
    to the nested `permission` records — the frontend's Role type expects
    `permissions: Permission[]`, not join rows."""
    return orm_to_dict(role, extra={"permissions": [orm_to_dict(rp.permission) for rp in role.permissions]})


# ─── Public CMS/Blog/Hero banner reads ───


@router.get("/cms/{slug}")
async def get_cms_page(slug: str, db: AsyncSession = Depends(get_db)):
    page = (await db.execute(select(CmsPage).where(CmsPage.slug == slug))).scalar_one_or_none()
    if page is None:
        raise ApiError.not_found("Page not found")
    return success_response(orm_to_dict(page))


@router.get("/blog")
async def list_blog_posts(pagination: Pagination = Depends(get_pagination()), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(BlogPost)
        .where(BlogPost.status == BlogStatus.PUBLISHED)
        .order_by(BlogPost.published_at.desc())
        .offset(pagination.skip)
        .limit(pagination.take)
    )
    posts = (await db.execute(stmt)).scalars().all()
    total = (
        await db.execute(select(func.count()).select_from(BlogPost).where(BlogPost.status == BlogStatus.PUBLISHED))
    ).scalar_one()
    return success_response(
        [orm_to_dict(p) for p in posts], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.get("/blog/{slug}")
async def get_blog_post(slug: str, db: AsyncSession = Depends(get_db)):
    post = (await db.execute(select(BlogPost).where(BlogPost.slug == slug))).scalar_one_or_none()
    if post is None:
        raise ApiError.not_found("Blog post not found")
    return success_response(orm_to_dict(post))


@router.get("/hero-banners")
async def list_hero_banner_slides(db: AsyncSession = Depends(get_db)):
    stmt = select(HeroBannerSlide).where(HeroBannerSlide.is_active.is_(True)).order_by(HeroBannerSlide.sort_order)
    slides = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(s) for s in slides])


# ─── Dashboard analytics ───


@router.get("/dashboard", dependencies=[admin_only, Depends(require_permission("analytics.view"))])
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    active_statuses = (
        BookingStatus.CONFIRMED,
        BookingStatus.APPROVED,
        BookingStatus.VEHICLE_READY,
        BookingStatus.PICKED_UP,
        BookingStatus.ACTIVE,
        BookingStatus.RETURNING,
    )

    total_customers = (
        await db.execute(select(func.count()).select_from(User).where(User.user_type == UserType.CUSTOMER))
    ).scalar_one()
    total_partners = (await db.execute(select(func.count()).select_from(RentalPartner))).scalar_one()
    verified_partners = (
        await db.execute(
            select(func.count())
            .select_from(RentalPartner)
            .where(RentalPartner.verification_status == PartnerVerificationStatus.VERIFIED)
        )
    ).scalar_one()
    total_vehicles = (await db.execute(select(func.count()).select_from(Vehicle))).scalar_one()
    pending_vehicle_approvals = (
        await db.execute(
            select(func.count()).select_from(Vehicle).where(Vehicle.approval_status == VehicleApprovalStatus.PENDING)
        )
    ).scalar_one()
    total_bookings = (await db.execute(select(func.count()).select_from(Booking))).scalar_one()
    active_bookings = (
        await db.execute(select(func.count()).select_from(Booking).where(Booking.status.in_(active_statuses)))
    ).scalar_one()
    # `total_booking_value` is GMV — what customers paid, tax and refundable
    # deposit included. It is NOT platform earnings, so it's kept separate from
    # `total_revenue` below rather than mislabeled as "revenue".
    total_booking_value = (
        await db.execute(select(func.sum(Booking.total_amount)).where(Booking.status == BookingStatus.COMPLETED))
    ).scalar_one()
    commission_total = (
        await db.execute(select(func.sum(Transaction.amount)).where(Transaction.type == TransactionType.COMMISSION))
    ).scalar_one() or Decimal("0")
    # Payout fee is stored in `transaction_metadata` (JSON), not a discrete
    # column — summed in Python rather than a dialect-specific JSON path query,
    # since this is a low-volume admin aggregate, not a hot path.
    payout_metadata_rows = (
        await db.execute(select(Transaction.transaction_metadata).where(Transaction.type == TransactionType.PAYOUT))
    ).scalars().all()
    payout_fee_total = sum(
        (Decimal(str(meta["payoutFee"])) for meta in payout_metadata_rows if meta and meta.get("payoutFee")),
        Decimal("0"),
    )
    total_revenue = commission_total + payout_fee_total
    pending_support_tickets = (
        await db.execute(
            select(func.count())
            .select_from(SupportTicket)
            .where(SupportTicket.status.in_((SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS)))
        )
    ).scalar_one()

    return success_response(
        {
            "totalCustomers": total_customers,
            "totalPartners": total_partners,
            "verifiedPartners": verified_partners,
            "totalVehicles": total_vehicles,
            "pendingVehicleApprovals": pending_vehicle_approvals,
            "totalBookings": total_bookings,
            "activeBookings": active_bookings,
            "totalBookingValue": total_booking_value if total_booking_value is not None else 0,
            "totalRevenue": total_revenue,
            "pendingSupportTickets": pending_support_tickets,
        }
    )


# ─── Roles & Permissions ───


@router.get("/permissions", dependencies=[admin_only, Depends(require_permission("roles.manage"))])
async def list_permissions(db: AsyncSession = Depends(get_db)):
    stmt = select(Permission).order_by(Permission.module, Permission.key)
    permissions = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(p) for p in permissions])


@router.get("/roles", dependencies=[admin_only, Depends(require_permission("roles.manage"))])
async def list_roles(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Role)
        .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
        .order_by(Role.name)
    )
    roles = (await db.execute(stmt)).scalars().all()
    return success_response([_serialize_role(r) for r in roles])


@router.post("/roles", dependencies=[admin_only, Depends(require_permission("roles.manage"))], status_code=201)
async def create_role(payload: CreateRoleInput, db: AsyncSession = Depends(get_db)):
    role = Role(name=payload.name, description=payload.description)
    db.add(role)
    await db.flush()
    for permission_id in payload.permissionIds:
        db.add(RolePermission(role_id=role.id, permission_id=permission_id))
    await db.commit()

    stmt = (
        select(Role)
        .where(Role.id == role.id)
        .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
    )
    role = (await db.execute(stmt)).scalar_one()
    return success_response(_serialize_role(role), 201)


@router.patch("/roles/{id}", dependencies=[admin_only, Depends(require_permission("roles.manage"))])
async def update_role(id: UuidPath, payload: UpdateRoleInput, db: AsyncSession = Depends(get_db)):
    role = await db.get(Role, id)
    if role is None:
        raise ApiError.not_found("Role not found")
    if role.is_system:
        raise ApiError.forbidden("System roles cannot be modified")

    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description

    if payload.permissionIds is not None:
        await db.execute(RolePermission.__table__.delete().where(RolePermission.role_id == id))
        for permission_id in payload.permissionIds:
            db.add(RolePermission(role_id=id, permission_id=permission_id))

    await db.commit()
    await db.refresh(role)
    return success_response(orm_to_dict(role))


@router.delete("/roles/{id}", dependencies=[admin_only, Depends(require_permission("roles.manage"))])
async def delete_role(id: UuidPath, db: AsyncSession = Depends(get_db)):
    role = await db.get(Role, id)
    if role is None:
        raise ApiError.not_found("Role not found")
    if role.is_system:
        raise ApiError.forbidden("System roles cannot be deleted")
    await db.delete(role)
    await db.commit()
    return success_response({"message": "Role deleted"})


@router.post(
    "/users/{userId}/role", dependencies=[admin_only, Depends(require_permission("roles.manage"))], status_code=201
)
async def assign_role_to_user(userId: UuidPath, payload: AssignRoleInput, db: AsyncSession = Depends(get_db)):
    target_user = await db.get(User, userId)
    if target_user is None:
        raise ApiError.not_found("User not found")
    if target_user.user_type not in (UserType.ADMIN, UserType.SUPER_ADMIN):
        raise ApiError.bad_request("Only admin accounts can be assigned RBAC roles")

    existing = await db.get(UserRole, {"user_id": userId, "role_id": payload.roleId})
    if existing is None:
        existing = UserRole(user_id=userId, role_id=payload.roleId)
        db.add(existing)
        await db.commit()
    return success_response(orm_to_dict(existing), 201)


# ─── Users ───


@router.get("/users", dependencies=[admin_only, Depends(require_permission("users.manage"))])
async def list_users(
    userType: UserType | None = Query(default=None),
    status: AccountStatus | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    conditions = []
    if userType is not None:
        conditions.append(User.user_type == userType)
    if status is not None:
        conditions.append(User.account_status == status)

    stmt = select(User).where(*conditions).order_by(User.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    users = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(User).where(*conditions))).scalar_one()


    return success_response(
        [sanitize_user(u) for u in users], meta=pagination_meta(pagination.page, pagination.limit, total)
    )


@router.get("/users/{id}", dependencies=[admin_only, Depends(require_permission("users.manage"))])
async def get_user(id: UuidPath, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, id)
    if user is None:
        raise ApiError.not_found()
    return success_response(sanitize_user(user))


@router.patch("/users/{id}/status", dependencies=[admin_only, Depends(require_permission("users.manage"))])
async def update_user_status(id: UuidPath, payload: UpdateUserStatusInput, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, id)
    if user is None:
        raise ApiError.not_found()
    new_status = AccountStatus(payload.status)
    user.account_status = new_status
    await db.commit()
    await db.refresh(user)

    is_blocked = new_status in (AccountStatus.SUSPENDED, AccountStatus.BANNED)
    update_firebase_user(user.firebase_uid, disabled=is_blocked)
    if is_blocked:
        revoke_refresh_tokens(user.firebase_uid)

    return success_response(sanitize_user(user))


# ─── Audit logs ───


@router.get("/audit-logs", dependencies=[admin_only, Depends(require_permission("audit.view"))])
async def list_audit_logs(
    entityType: str | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):
    conditions = []
    if entityType:
        conditions.append(AuditLog.entity_type == entityType)

    stmt = (
        select(AuditLog).where(*conditions).order_by(AuditLog.created_at.desc()).offset(pagination.skip).limit(pagination.take)
    )
    logs = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(select(func.count()).select_from(AuditLog).where(*conditions))).scalar_one()

    return success_response([orm_to_dict(log) for log in logs], meta=pagination_meta(pagination.page, pagination.limit, total))


# ─── Driving licenses ───


@router.get("/driving-licenses", dependencies=[admin_only, Depends(require_permission("users.manage"))])
async def list_driving_licenses(
    status: DrivingLicenseStatus | None = Query(default=None),
    pagination: Pagination = Depends(get_pagination()),
    db: AsyncSession = Depends(get_db),
):

    stmt = select(DrivingLicense).options(selectinload(DrivingLicense.user))
    count_stmt = select(func.count()).select_from(DrivingLicense)
    if status is not None:
        stmt = stmt.where(DrivingLicense.status == status)
        count_stmt = count_stmt.where(DrivingLicense.status == status)
    stmt = stmt.order_by(DrivingLicense.created_at.desc()).offset(pagination.skip).limit(pagination.take)

    licenses = (await db.execute(stmt)).scalars().all()
    total = (await db.execute(count_stmt)).scalar_one()

    return success_response(
        [orm_to_dict(license_, extra={"user": sanitize_user(license_.user)}) for license_ in licenses],
        meta=pagination_meta(pagination.page, pagination.limit, total),
    )


@router.patch(
    "/driving-licenses/{id}/review", dependencies=[admin_only, Depends(require_permission("users.manage"))]
)
async def review_driving_license(id: UuidPath, payload: ReviewDrivingLicenseInput, db: AsyncSession = Depends(get_db)):
    license_ = await db.get(DrivingLicense, id)
    if license_ is None:
        raise ApiError.not_found()
    license_.status = DrivingLicenseStatus(payload.status)
    license_.rejection_reason = payload.rejectionReason
    license_.verified_at = datetime.now(timezone.utc) if payload.status == "VERIFIED" else None
    await db.commit()
    await db.refresh(license_)
    return success_response(orm_to_dict(license_))


# ─── CMS ───


@router.put("/cms", dependencies=[admin_only, Depends(require_permission("cms.manage"))])
async def upsert_cms_page(payload: UpsertCmsPageInput, db: AsyncSession = Depends(get_db)):
    page = (await db.execute(select(CmsPage).where(CmsPage.slug == payload.slug))).scalar_one_or_none()
    if page is None:
        page = CmsPage(slug=payload.slug, title=payload.title, content=payload.content)
        db.add(page)
    else:
        page.title = payload.title
        page.content = payload.content
    await db.commit()
    await db.refresh(page)
    return success_response(orm_to_dict(page))


# ─── Blog ───


@router.put("/blog", dependencies=[admin_only, Depends(require_permission("cms.manage"))])
async def upsert_blog_post(payload: UpsertBlogPostInput, db: AsyncSession = Depends(get_db)):
    published_at = datetime.now(timezone.utc) if payload.status == "PUBLISHED" else None
    post = (await db.execute(select(BlogPost).where(BlogPost.slug == payload.slug))).scalar_one_or_none()
    if post is None:
        post = BlogPost(
            slug=payload.slug,
            title=payload.title,
            excerpt=payload.excerpt,
            content=payload.content,
            cover_image_url=payload.coverImageUrl,
            status=BlogStatus(payload.status),
            published_at=published_at,
        )
        db.add(post)
    else:
        post.title = payload.title
        post.excerpt = payload.excerpt
        post.content = payload.content
        post.cover_image_url = payload.coverImageUrl
        post.status = BlogStatus(payload.status)
        post.published_at = published_at
    await db.commit()
    await db.refresh(post)
    return success_response(orm_to_dict(post))


# ─── Hero banner slides (admin) ───


@router.get("/hero-banners/manage", dependencies=[admin_only, Depends(require_permission("cms.manage"))])
async def admin_list_hero_banner_slides(db: AsyncSession = Depends(get_db)):
    stmt = select(HeroBannerSlide).order_by(HeroBannerSlide.sort_order)
    slides = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(s) for s in slides])


@router.post("/hero-banners", dependencies=[admin_only, Depends(require_permission("cms.manage"))], status_code=201)
async def create_hero_banner_slide(payload: CreateHeroBannerSlideInput, db: AsyncSession = Depends(get_db)):
    slide = HeroBannerSlide(
        title=payload.title,
        subtitle=payload.subtitle,
        image_url=payload.imageUrl,
        cta_label=payload.ctaLabel,
        cta_url=payload.ctaUrl,
        sort_order=payload.sortOrder,
        is_active=payload.isActive if payload.isActive is not None else True,
        is_sponsored=payload.isSponsored if payload.isSponsored is not None else False,
        sponsor_name=payload.sponsorName,
        amount_charged=payload.amountCharged,
    )
    db.add(slide)
    await db.commit()
    await db.refresh(slide)
    return success_response(orm_to_dict(slide), 201)


@router.patch("/hero-banners/{id}", dependencies=[admin_only, Depends(require_permission("cms.manage"))])
async def update_hero_banner_slide(id: UuidPath, payload: UpdateHeroBannerSlideInput, db: AsyncSession = Depends(get_db)):
    slide = await db.get(HeroBannerSlide, id)
    if slide is None:
        raise ApiError.not_found()
    field_map = {
        "imageUrl": "image_url",
        "ctaLabel": "cta_label",
        "ctaUrl": "cta_url",
        "sortOrder": "sort_order",
        "isActive": "is_active",
        "isSponsored": "is_sponsored",
        "sponsorName": "sponsor_name",
        "amountCharged": "amount_charged",
    }
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(slide, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(slide)
    return success_response(orm_to_dict(slide))


@router.delete("/hero-banners/{id}", dependencies=[admin_only, Depends(require_permission("cms.manage"))])
async def delete_hero_banner_slide(id: UuidPath, db: AsyncSession = Depends(get_db)):
    slide = await db.get(HeroBannerSlide, id)
    if slide is None:
        raise ApiError.not_found()
    await db.delete(slide)
    await db.commit()
    return success_response({"message": "Hero banner slide deleted"})


# ─── Ad slots (admin) ───


@router.get("/ad-slots/manage", dependencies=[admin_only, Depends(require_permission("ads.manage"))])
async def admin_list_ad_slots(db: AsyncSession = Depends(get_db)):
    stmt = select(AdSlot).order_by(AdSlot.sort_order)
    slots = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(s) for s in slots])


@router.post("/ad-slots", dependencies=[admin_only, Depends(require_permission("ads.manage"))], status_code=201)
async def create_ad_slot(payload: CreateAdSlotInput, db: AsyncSession = Depends(get_db)):
    slot = AdSlot(
        title=payload.title,
        subtitle=payload.subtitle,
        image_url=payload.imageUrl,
        cta_label=payload.ctaLabel,
        cta_url=payload.ctaUrl,
        sponsor_name=payload.sponsorName,
        amount_charged=payload.amountCharged,
        sort_order=payload.sortOrder,
        is_active=payload.isActive if payload.isActive is not None else True,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return success_response(orm_to_dict(slot), 201)


@router.patch("/ad-slots/{id}", dependencies=[admin_only, Depends(require_permission("ads.manage"))])
async def update_ad_slot(id: UuidPath, payload: UpdateAdSlotInput, db: AsyncSession = Depends(get_db)):
    slot = await db.get(AdSlot, id)
    if slot is None:
        raise ApiError.not_found()
    field_map = {
        "imageUrl": "image_url",
        "ctaLabel": "cta_label",
        "ctaUrl": "cta_url",
        "sponsorName": "sponsor_name",
        "amountCharged": "amount_charged",
        "sortOrder": "sort_order",
        "isActive": "is_active",
    }
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(slot, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(slot)
    return success_response(orm_to_dict(slot))


@router.delete("/ad-slots/{id}", dependencies=[admin_only, Depends(require_permission("ads.manage"))])
async def delete_ad_slot(id: UuidPath, db: AsyncSession = Depends(get_db)):
    slot = await db.get(AdSlot, id)
    if slot is None:
        raise ApiError.not_found()
    await db.delete(slot)
    await db.commit()
    return success_response({"message": "Ad slot deleted"})


# ─── Affiliate partners (admin) ───


@router.get("/affiliate-partners/manage", dependencies=[admin_only, Depends(require_permission("affiliates.manage"))])
async def admin_list_affiliate_partners(db: AsyncSession = Depends(get_db)):
    stmt = select(AffiliatePartner).order_by(AffiliatePartner.sort_order)
    partners = (await db.execute(stmt)).scalars().all()
    return success_response([orm_to_dict(p) for p in partners])


@router.post(
    "/affiliate-partners", dependencies=[admin_only, Depends(require_permission("affiliates.manage"))], status_code=201
)
async def create_affiliate_partner(payload: CreateAffiliatePartnerInput, db: AsyncSession = Depends(get_db)):
    partner = AffiliatePartner(
        name=payload.name,
        category=AffiliateCategory(payload.category),
        tagline=payload.tagline,
        cta_label=payload.ctaLabel,
        referral_url=payload.referralUrl,
        logo_url=payload.logoUrl,
        sort_order=payload.sortOrder,
        is_active=payload.isActive if payload.isActive is not None else True,
    )
    db.add(partner)
    await db.commit()
    await db.refresh(partner)
    return success_response(orm_to_dict(partner), 201)


@router.patch("/affiliate-partners/{id}", dependencies=[admin_only, Depends(require_permission("affiliates.manage"))])
async def update_affiliate_partner(id: UuidPath, payload: UpdateAffiliatePartnerInput, db: AsyncSession = Depends(get_db)):
    partner = await db.get(AffiliatePartner, id)
    if partner is None:
        raise ApiError.not_found()
    field_map = {"ctaLabel": "cta_label", "referralUrl": "referral_url", "logoUrl": "logo_url", "sortOrder": "sort_order", "isActive": "is_active"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "category":
            partner.category = AffiliateCategory(value)
            continue
        setattr(partner, field_map.get(field, field), value)
    await db.commit()
    await db.refresh(partner)
    return success_response(orm_to_dict(partner))


@router.delete("/affiliate-partners/{id}", dependencies=[admin_only, Depends(require_permission("affiliates.manage"))])
async def delete_affiliate_partner(id: UuidPath, db: AsyncSession = Depends(get_db)):
    partner = await db.get(AffiliatePartner, id)
    if partner is None:
        raise ApiError.not_found()
    await db.delete(partner)
    await db.commit()
    return success_response({"message": "Affiliate partner deleted"})


# ─── Settings ───


@router.get("/settings/{key}", dependencies=[admin_only, Depends(require_permission("settings.manage"))])
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    setting = await db.get(Setting, key)
    if setting is None:
        raise ApiError.not_found("Setting not found")
    return success_response(orm_to_dict(setting))


@router.put("/settings/{key}", dependencies=[admin_only, Depends(require_permission("settings.manage"))])
async def upsert_setting(key: str, payload: UpsertSettingInput, db: AsyncSession = Depends(get_db)):
    setting = await db.get(Setting, key)
    if setting is None:
        setting = Setting(key=key, value=payload.value)
        db.add(setting)
    else:
        setting.value = payload.value
    await db.commit()
    await db.refresh(setting)
    return success_response(orm_to_dict(setting))


# ─── Monetization features ───
# Every revenue mechanism (commission, fees, boosted listings, subscriptions, ...)
# is registered here as a togglable row, disabled by default. Downstream modules
# call `monetization_service.is_enabled(...)` before applying any of it.


@router.get("/monetization/features", dependencies=[admin_only, Depends(require_permission("monetization.manage"))])
async def list_monetization_features(db: AsyncSession = Depends(get_db)):
    features = await monetization_service.list_features(db)
    return success_response([orm_to_dict(f) for f in features])


@router.patch(
    "/monetization/features/{key}", dependencies=[admin_only, Depends(require_permission("monetization.manage"))]
)
async def update_monetization_feature(
    key: MonetizationFeatureKey,
    payload: UpdateFeatureInput,
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feature = await monetization_service.update_feature(
        db, key, is_enabled=payload.isEnabled, config=payload.config, actor_id=user.id
    )
    return success_response(orm_to_dict(feature))
