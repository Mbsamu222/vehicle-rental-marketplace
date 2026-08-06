from enum import Enum


class UserType(str, Enum):
    CUSTOMER = "CUSTOMER"
    RENTAL_PARTNER = "RENTAL_PARTNER"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class AccountStatus(str, Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BANNED = "BANNED"


class PartnerVerificationStatus(str, Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class DocumentType(str, Enum):
    BUSINESS_LICENSE = "BUSINESS_LICENSE"
    GST_CERTIFICATE = "GST_CERTIFICATE"
    IDENTITY_PROOF = "IDENTITY_PROOF"
    ADDRESS_PROOF = "ADDRESS_PROOF"
    BANK_PROOF = "BANK_PROOF"
    OTHER = "OTHER"


class DocumentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class VehicleApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class VehicleTransmission(str, Enum):
    MANUAL = "MANUAL"
    AUTOMATIC = "AUTOMATIC"


class FuelType(str, Enum):
    PETROL = "PETROL"
    DIESEL = "DIESEL"
    ELECTRIC = "ELECTRIC"
    HYBRID = "HYBRID"
    CNG = "CNG"


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    VEHICLE_READY = "VEHICLE_READY"
    PICKED_UP = "PICKED_UP"
    ACTIVE = "ACTIVE"
    RETURNING = "RETURNING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


class PaymentProvider(str, Enum):
    RAZORPAY = "RAZORPAY"
    STRIPE = "STRIPE"
    WALLET = "WALLET"


class TransactionType(str, Enum):
    BOOKING_PAYMENT = "BOOKING_PAYMENT"
    REFUND = "REFUND"
    PAYOUT = "PAYOUT"
    WALLET_TOPUP = "WALLET_TOPUP"
    WALLET_DEBIT = "WALLET_DEBIT"
    COMMISSION = "COMMISSION"
    LATE_RETURN_FEE = "LATE_RETURN_FEE"


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class NotificationChannel(str, Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    PUSH = "PUSH"
    SMS = "SMS"


class SupportTicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class CouponType(str, Enum):
    FLAT = "FLAT"
    PERCENTAGE = "PERCENTAGE"


class DrivingLicenseStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class SubscriptionStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class BlogStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class OtpPurpose(str, Enum):
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PHONE_VERIFICATION = "PHONE_VERIFICATION"
    PASSWORD_RESET = "PASSWORD_RESET"


class MonetizationFeatureKey(str, Enum):
    """Every revenue mechanism the platform can switch on, gated independently so
    each can be enabled later (e.g. after a free-access promo period) without a
    code change."""

    BOOKING_COMMISSION = "BOOKING_COMMISSION"
    PAYOUT_FEE = "PAYOUT_FEE"
    SERVICE_FEE = "SERVICE_FEE"
    EXTRA_DRIVER_FEE = "EXTRA_DRIVER_FEE"
    YOUNG_DRIVER_FEE = "YOUNG_DRIVER_FEE"
    LATE_RETURN_FEE = "LATE_RETURN_FEE"
    CANCELLATION_FEE = "CANCELLATION_FEE"
    BOOSTED_LISTINGS = "BOOSTED_LISTINGS"
    SPONSORED_PLACEMENTS = "SPONSORED_PLACEMENTS"
    AFFILIATE_PROGRAM = "AFFILIATE_PROGRAM"
    PARTNER_SUBSCRIPTIONS = "PARTNER_SUBSCRIPTIONS"
    FLEET_ANALYTICS = "FLEET_ANALYTICS"


class AffiliateCategory(str, Enum):
    INSURANCE = "INSURANCE"
    ROADSIDE_ASSISTANCE = "ROADSIDE_ASSISTANCE"
    FUEL = "FUEL"
    OTHER = "OTHER"


class InspectionType(str, Enum):
    """Which end of the rental a condition report was captured at."""

    PICKUP = "PICKUP"
    RETURN = "RETURN"


class FuelLevel(str, Enum):
    """Coarse gauge reading. Deliberately not a percentage — partners read a
    needle at handover, and fake precision invites disputes."""

    EMPTY = "EMPTY"
    QUARTER = "QUARTER"
    HALF = "HALF"
    THREE_QUARTER = "THREE_QUARTER"
    FULL = "FULL"


class TrafficFineStatus(str, Enum):
    PENDING = "PENDING"
    NOTIFIED = "NOTIFIED"
    PAID_BY_CUSTOMER = "PAID_BY_CUSTOMER"
    DEDUCTED_FROM_DEPOSIT = "DEDUCTED_FROM_DEPOSIT"
    WAIVED = "WAIVED"
    DISPUTED = "DISPUTED"


class ExtensionStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class DriverVerificationStatus(str, Enum):
    """Mirrors PartnerVerificationStatus — a driver carries passengers, so the
    same document review gate applies before they can be hired."""

    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class DriverAssignmentStatus(str, Enum):
    """Lifecycle of a driver attached to one booking."""

    REQUESTED = "REQUESTED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class DriverDocumentType(str, Enum):
    DRIVING_LICENSE = "DRIVING_LICENSE"
    IDENTITY_PROOF = "IDENTITY_PROOF"
    ADDRESS_PROOF = "ADDRESS_PROOF"
    POLICE_VERIFICATION = "POLICE_VERIFICATION"
    PHOTO = "PHOTO"
