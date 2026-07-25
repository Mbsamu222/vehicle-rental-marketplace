import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import (
    AccountStatus,
    AffiliateCategory,
    BlogStatus,
    BookingStatus,
    CouponType,
    DocumentStatus,
    DocumentType,
    DrivingLicenseStatus,
    FuelType,
    MonetizationFeatureKey,
    NotificationChannel,
    PartnerVerificationStatus,
    PaymentProvider,
    PaymentStatus,
    SubscriptionStatus,
    SupportTicketStatus,
    TransactionStatus,
    TransactionType,
    UserType,
    VehicleApprovalStatus,
    VehicleTransmission,
)


def _uuid() -> str:
    return str(uuid.uuid4())


def _created_at() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# AUTH / RBAC
# ──────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    firebase_uid: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String, unique=True)
    password_hash: Mapped[str | None] = mapped_column(String)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    avatar_url: Mapped[str | None] = mapped_column(String)
    user_type: Mapped[UserType] = mapped_column(SAEnum(UserType, name="user_type"), index=True)
    account_status: Mapped[AccountStatus] = mapped_column(
        SAEnum(AccountStatus, name="account_status"), default=AccountStatus.PENDING_VERIFICATION, index=True
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    phone_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    referral_code: Mapped[str | None] = mapped_column(String, unique=True)
    referred_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    referred_by: Mapped["User | None"] = relationship("User", remote_side=[id], back_populates="referrals")
    referrals: Mapped[list["User"]] = relationship("User", back_populates="referred_by")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    rental_partner: Mapped["RentalPartner | None"] = relationship(back_populates="user")
    driving_licenses: Mapped[list["DrivingLicense"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="customer")
    reviews: Mapped[list["Review"]] = relationship(back_populates="customer")
    review_replies: Mapped[list["ReviewReply"]] = relationship(back_populates="author")
    wishlist: Mapped[list["WishlistItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    saved_locations: Mapped[list["SavedLocation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    wallet: Mapped["Wallet | None"] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    support_tickets: Mapped[list["SupportTicket"]] = relationship(back_populates="user")
    support_messages: Mapped[list["SupportTicketMessage"]] = relationship(back_populates="author")
    review_reports: Mapped[list["ReviewReport"]] = relationship(back_populates="reported_by")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    permissions: Mapped[list["RolePermission"]] = relationship(back_populates="role", cascade="all, delete-orphan")
    users: Mapped[list["UserRole"]] = relationship(back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    key: Mapped[str] = mapped_column(String, unique=True)
    module: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)

    roles: Mapped[list["RolePermission"]] = relationship(back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )

    role: Mapped["Role"] = relationship(back_populates="permissions")
    permission: Mapped["Permission"] = relationship(back_populates="roles")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

    user: Mapped["User"] = relationship(back_populates="roles")
    role: Mapped["Role"] = relationship(back_populates="users")


# ──────────────────────────────────────────────
# GEOGRAPHY
# ──────────────────────────────────────────────


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    code: Mapped[str] = mapped_column(String, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    cities: Mapped[list["City"]] = relationship(back_populates="country")


class City(Base):
    __tablename__ = "cities"
    __table_args__ = (UniqueConstraint("name", "country_id", name="uq_city_name_country"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String)
    country_id: Mapped[str] = mapped_column(String(36), ForeignKey("countries.id"))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    country: Mapped["Country"] = relationship(back_populates="cities")
    rental_partners: Mapped[list["RentalPartner"]] = relationship(back_populates="city")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="city")
    saved_locations: Mapped[list["SavedLocation"]] = relationship(back_populates="city")


# ──────────────────────────────────────────────
# RENTAL PARTNER
# ──────────────────────────────────────────────


class RentalPartner(Base):
    __tablename__ = "rental_partners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True)
    business_name: Mapped[str] = mapped_column(String)
    business_email: Mapped[str] = mapped_column(String)
    business_phone: Mapped[str] = mapped_column(String)
    city_id: Mapped[str] = mapped_column(String(36), ForeignKey("cities.id"), index=True)
    address: Mapped[str] = mapped_column(Text)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    logo_url: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    verification_status: Mapped[PartnerVerificationStatus] = mapped_column(
        SAEnum(PartnerVerificationStatus, name="partner_verification_status"),
        default=PartnerVerificationStatus.PENDING,
        index=True,
    )
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("10"))
    average_rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0"))
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="rental_partner")
    city: Mapped["City"] = relationship(back_populates="rental_partners")
    documents: Mapped[list["BusinessDocument"]] = relationship(back_populates="rental_partner", cascade="all, delete-orphan")
    bank_details: Mapped["BankDetail | None"] = relationship(back_populates="rental_partner", cascade="all, delete-orphan")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="rental_partner")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="rental_partner")
    reviews: Mapped[list["Review"]] = relationship(back_populates="rental_partner")
    subscriptions: Mapped[list["PartnerSubscription"]] = relationship(back_populates="rental_partner")
    payouts: Mapped[list["Transaction"]] = relationship(back_populates="rental_partner")
    support_tickets: Mapped[list["SupportTicket"]] = relationship(back_populates="rental_partner")


class BusinessDocument(Base):
    __tablename__ = "business_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    rental_partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("rental_partners.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[DocumentType] = mapped_column(SAEnum(DocumentType, name="document_type"))
    file_url: Mapped[str] = mapped_column(String)
    status: Mapped[DocumentStatus] = mapped_column(SAEnum(DocumentStatus, name="document_status"), default=DocumentStatus.PENDING)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    rental_partner: Mapped["RentalPartner"] = relationship(back_populates="documents")


class BankDetail(Base):
    __tablename__ = "bank_details"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    rental_partner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("rental_partners.id", ondelete="CASCADE"), unique=True
    )
    account_holder: Mapped[str] = mapped_column(String)
    account_number: Mapped[str] = mapped_column(String)
    ifsc_code: Mapped[str] = mapped_column(String)
    bank_name: Mapped[str] = mapped_column(String)
    branch: Mapped[str | None] = mapped_column(String)
    upi_id: Mapped[str | None] = mapped_column(String)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    rental_partner: Mapped["RentalPartner"] = relationship(back_populates="bank_details")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    duration_days: Mapped[int] = mapped_column(Integer)
    max_vehicles: Mapped[int | None] = mapped_column(Integer)
    features: Mapped[dict | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    subscriptions: Mapped[list["PartnerSubscription"]] = relationship(back_populates="plan")


class PartnerSubscription(Base):
    __tablename__ = "partner_subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    rental_partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("rental_partners.id"), index=True)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("subscription_plans.id"))
    status: Mapped[SubscriptionStatus] = mapped_column(
        SAEnum(SubscriptionStatus, name="subscription_status"), default=SubscriptionStatus.ACTIVE
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    rental_partner: Mapped["RentalPartner"] = relationship(back_populates="subscriptions")
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="subscriptions")


# ──────────────────────────────────────────────
# VEHICLES
# ──────────────────────────────────────────────


class VehicleCategory(Base):
    __tablename__ = "vehicle_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    slug: Mapped[str] = mapped_column(String, unique=True)
    icon_url: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="category")


class VehicleBrand(Base):
    __tablename__ = "vehicle_brands"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, unique=True)
    logo_url: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="brand")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    rental_partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("rental_partners.id"), index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicle_categories.id"), index=True)
    brand_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicle_brands.id"))
    city_id: Mapped[str] = mapped_column(String(36), ForeignKey("cities.id"), index=True)
    model: Mapped[str] = mapped_column(String)
    year: Mapped[int] = mapped_column(Integer)
    registration_number: Mapped[str] = mapped_column(String, unique=True)
    transmission: Mapped[VehicleTransmission] = mapped_column(SAEnum(VehicleTransmission, name="vehicle_transmission"))
    fuel_type: Mapped[FuelType] = mapped_column(SAEnum(FuelType, name="fuel_type"))
    seating_capacity: Mapped[int] = mapped_column(Integer)
    price_per_hour: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    price_per_day: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    security_deposit: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    insurance_details: Mapped[str | None] = mapped_column(Text)
    rental_policies: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    approval_status: Mapped[VehicleApprovalStatus] = mapped_column(
        SAEnum(VehicleApprovalStatus, name="vehicle_approval_status"), default=VehicleApprovalStatus.PENDING, index=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    featured_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    average_rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0"))
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    total_bookings: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    rental_partner: Mapped["RentalPartner"] = relationship(back_populates="vehicles")
    category: Mapped["VehicleCategory"] = relationship(back_populates="vehicles")
    brand: Mapped["VehicleBrand"] = relationship(back_populates="vehicles")
    city: Mapped["City"] = relationship(back_populates="vehicles")
    images: Mapped[list["VehicleImage"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")
    availability: Mapped[list["VehicleAvailability"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="vehicle")
    reviews: Mapped[list["Review"]] = relationship(back_populates="vehicle")
    wishlisted_by: Mapped[list["WishlistItem"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")
    boosts: Mapped[list["VehicleBoost"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")


class VehicleImage(Base):
    __tablename__ = "vehicle_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicle: Mapped["Vehicle"] = relationship(back_populates="images")


class VehicleAvailability(Base):
    __tablename__ = "vehicle_availabilities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicle: Mapped["Vehicle"] = relationship(back_populates="availability")


class VehicleBoost(Base):
    """Audit/history log of each boosted-listing grant, alongside the current-state
    flags (`Vehicle.is_featured`/`featured_until`) — mirrors `BookingStatusHistory`."""

    __tablename__ = "vehicle_boosts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    granted_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    amount_charged: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicle: Mapped["Vehicle"] = relationship(back_populates="boosts")
    granted_by: Mapped["User | None"] = relationship()


# ──────────────────────────────────────────────
# DRIVING LICENSE
# ──────────────────────────────────────────────


class DrivingLicense(Base):
    __tablename__ = "driving_licenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    license_number: Mapped[str] = mapped_column(String)
    front_image_url: Mapped[str] = mapped_column(String)
    back_image_url: Mapped[str | None] = mapped_column(String)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[DrivingLicenseStatus] = mapped_column(
        SAEnum(DrivingLicenseStatus, name="driving_license_status"), default=DrivingLicenseStatus.PENDING
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="driving_licenses")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="driving_license")


# ──────────────────────────────────────────────
# COUPONS / OFFERS
# ──────────────────────────────────────────────


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String, unique=True)
    type: Mapped[CouponType] = mapped_column(SAEnum(CouponType, name="coupon_type"))
    value: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    max_discount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    min_booking_value: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    usage_limit: Mapped[int | None] = mapped_column(Integer)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    per_user_limit: Mapped[int] = mapped_column(Integer, default=1)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    bookings: Mapped[list["Booking"]] = relationship(back_populates="coupon")


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# MONETIZATION
# ──────────────────────────────────────────────


class MonetizationFeature(Base):
    """One row per revenue mechanism the admin can toggle on/off, with a JSON
    config blob for its parameters (rates, caps, tiers, ...). Disabled by
    default — every module that computes a fee checks its row before acting,
    so behavior is unchanged from today until an admin explicitly opts in."""

    __tablename__ = "monetization_features"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    key: Mapped[MonetizationFeatureKey] = mapped_column(
        SAEnum(MonetizationFeatureKey, name="monetization_feature_key"), unique=True
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    config: Mapped[dict | None] = mapped_column(JSON)
    updated_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    updated_by: Mapped["User | None"] = relationship()


# ──────────────────────────────────────────────
# BOOKINGS
# ──────────────────────────────────────────────


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_number: Mapped[str] = mapped_column(String, unique=True)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id"), index=True)
    rental_partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("rental_partners.id"), index=True)
    driving_license_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("driving_licenses.id"))
    coupon_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("coupons.id"))
    pickup_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    return_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    pickup_location: Mapped[str] = mapped_column(Text)
    return_location: Mapped[str] = mapped_column(Text)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    security_deposit: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    service_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    extra_driver_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    young_driver_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    extra_driver_count: Mapped[int] = mapped_column(Integer, default=0)
    is_young_driver: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus, name="booking_status"), default=BookingStatus.PENDING, index=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    cancellation_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    actual_return_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    late_return_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    payout_transaction_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("transactions.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer: Mapped["User"] = relationship(back_populates="bookings")
    vehicle: Mapped["Vehicle"] = relationship(back_populates="bookings")
    rental_partner: Mapped["RentalPartner"] = relationship(back_populates="bookings")
    driving_license: Mapped["DrivingLicense | None"] = relationship(back_populates="bookings")
    coupon: Mapped["Coupon | None"] = relationship(back_populates="bookings")
    payout_transaction: Mapped["Transaction | None"] = relationship(foreign_keys=[payout_transaction_id])

    status_history: Mapped[list["BookingStatusHistory"]] = relationship(back_populates="booking", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="booking")
    invoice: Mapped["Invoice | None"] = relationship(back_populates="booking")
    review: Mapped["Review | None"] = relationship(back_populates="booking")


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_histories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), index=True)
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus, name="booking_status"))
    note: Mapped[str | None] = mapped_column(Text)
    changed_by_id: Mapped[str | None] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    booking: Mapped["Booking"] = relationship(back_populates="status_history")


# ──────────────────────────────────────────────
# PAYMENTS / TRANSACTIONS / WALLET
# ──────────────────────────────────────────────


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), index=True)
    provider: Mapped[PaymentProvider] = mapped_column(SAEnum(PaymentProvider, name="payment_provider"))
    provider_ref_id: Mapped[str | None] = mapped_column(String)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus, name="payment_status"), default=PaymentStatus.PENDING)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    refunded_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    booking: Mapped["Booking"] = relationship(back_populates="payments")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="payment")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    type: Mapped[TransactionType] = mapped_column(SAEnum(TransactionType, name="transaction_type"))
    status: Mapped[TransactionStatus] = mapped_column(
        SAEnum(TransactionStatus, name="transaction_status"), default=TransactionStatus.PENDING
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    payment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("payments.id"))
    rental_partner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("rental_partners.id"), index=True)
    wallet_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("wallets.id"), index=True)
    reference: Mapped[str | None] = mapped_column(String)
    transaction_metadata: Mapped[dict | None] = mapped_column("metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    payment: Mapped["Payment | None"] = relationship(back_populates="transactions")
    rental_partner: Mapped["RentalPartner | None"] = relationship(back_populates="payouts")
    wallet: Mapped["Wallet | None"] = relationship(back_populates="transactions")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), unique=True)
    invoice_number: Mapped[str] = mapped_column(String, unique=True)
    pdf_url: Mapped[str | None] = mapped_column(String)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    booking: Mapped["Booking"] = relationship(back_populates="invoice")


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True)
    balance: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="wallet")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="wallet")


# ──────────────────────────────────────────────
# REVIEWS
# ──────────────────────────────────────────────


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), unique=True)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id"), index=True)
    rental_partner_id: Mapped[str] = mapped_column(String(36), ForeignKey("rental_partners.id"), index=True)
    vehicle_rating: Mapped[int] = mapped_column(Integer)
    partner_rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text)
    is_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    booking: Mapped["Booking"] = relationship(back_populates="review")
    customer: Mapped["User"] = relationship(back_populates="reviews")
    vehicle: Mapped["Vehicle"] = relationship(back_populates="reviews")
    rental_partner: Mapped["RentalPartner"] = relationship(back_populates="reviews")
    images: Mapped[list["ReviewImage"]] = relationship(back_populates="review", cascade="all, delete-orphan")
    replies: Mapped[list["ReviewReply"]] = relationship(back_populates="review", cascade="all, delete-orphan")
    reports: Mapped[list["ReviewReport"]] = relationship(back_populates="review", cascade="all, delete-orphan")


class ReviewImage(Base):
    __tablename__ = "review_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String)

    review: Mapped["Review"] = relationship(back_populates="images")


class ReviewReply(Base):
    __tablename__ = "review_replies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    review: Mapped["Review"] = relationship(back_populates="replies")
    author: Mapped["User"] = relationship(back_populates="review_replies")


class ReviewReport(Base):
    __tablename__ = "review_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), index=True)
    reported_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    review: Mapped["Review"] = relationship(back_populates="reports")
    reported_by: Mapped["User"] = relationship(back_populates="review_reports")


# ──────────────────────────────────────────────
# WISHLIST / SAVED LOCATIONS
# ──────────────────────────────────────────────


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="wishlist")
    vehicle: Mapped["Vehicle"] = relationship(back_populates="wishlisted_by")


class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    city_id: Mapped[str] = mapped_column(String(36), ForeignKey("cities.id"))
    label: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(Text)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="saved_locations")
    city: Mapped["City"] = relationship(back_populates="saved_locations")


# ──────────────────────────────────────────────
# NOTIFICATIONS / SUPPORT
# ──────────────────────────────────────────────


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    channel: Mapped[NotificationChannel] = mapped_column(SAEnum(NotificationChannel, name="notification_channel"))
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(Text)
    data: Mapped[dict | None] = mapped_column(JSON)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="notifications")


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    rental_partner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("rental_partners.id"))
    subject: Mapped[str] = mapped_column(String)
    status: Mapped[SupportTicketStatus] = mapped_column(
        SAEnum(SupportTicketStatus, name="support_ticket_status"), default=SupportTicketStatus.OPEN, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="support_tickets")
    rental_partner: Mapped["RentalPartner | None"] = relationship(back_populates="support_tickets")
    messages: Mapped[list["SupportTicketMessage"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")


class SupportTicketMessage(Base):
    __tablename__ = "support_ticket_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("support_tickets.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ticket: Mapped["SupportTicket"] = relationship(back_populates="messages")
    author: Mapped["User"] = relationship(back_populates="support_messages")


# ──────────────────────────────────────────────
# CMS / BLOG / SETTINGS / LOGS
# ──────────────────────────────────────────────


class CmsPage(Base):
    __tablename__ = "cms_pages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    slug: Mapped[str] = mapped_column(String, unique=True)
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HeroBannerSlide(Base):
    __tablename__ = "hero_banner_slides"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String, unique=True)
    subtitle: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String)
    cta_label: Mapped[str | None] = mapped_column(String)
    cta_url: Mapped[str | None] = mapped_column(String)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_sponsored: Mapped[bool] = mapped_column(Boolean, default=False)
    sponsor_name: Mapped[str | None] = mapped_column(String)
    amount_charged: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdSlot(Base):
    """Paid placement outside the primary hero carousel (e.g. a homepage sponsors
    band). Same shape as `HeroBannerSlide` plus sponsor/billing fields — kept as
    a separate table since it targets a different placement, not the hero."""

    __tablename__ = "ad_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String)
    subtitle: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String)
    cta_label: Mapped[str | None] = mapped_column(String)
    cta_url: Mapped[str | None] = mapped_column(String)
    sponsor_name: Mapped[str | None] = mapped_column(String)
    amount_charged: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AffiliatePartner(Base):
    """Admin-managed directory of referral partners (insurance, roadside
    assistance, fuel, ...) shown to customers. MVP: static placement only — no
    click/conversion tracking, so this isn't measurable revenue yet, just
    marketing real-estate for affiliate relationships reconciled offline."""

    __tablename__ = "affiliate_partners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String)
    category: Mapped[AffiliateCategory] = mapped_column(SAEnum(AffiliateCategory, name="affiliate_category"))
    tagline: Mapped[str | None] = mapped_column(Text)
    cta_label: Mapped[str | None] = mapped_column(String)
    referral_url: Mapped[str] = mapped_column(String)
    logo_url: Mapped[str | None] = mapped_column(String)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    slug: Mapped[str] = mapped_column(String, unique=True)
    title: Mapped[str] = mapped_column(String)
    excerpt: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(String)
    status: Mapped[BlogStatus] = mapped_column(SAEnum(BlogStatus, name="blog_status"), default=BlogStatus.DRAFT)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), index=True)
    before: Mapped[dict | None] = mapped_column(JSON)
    after: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User | None"] = relationship()


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    activity: Mapped[str] = mapped_column(String)
    activity_metadata: Mapped[dict | None] = mapped_column("metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User | None"] = relationship()
