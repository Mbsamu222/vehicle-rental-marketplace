/// Mirrors backend/app/db/enums.py. All wire values are the raw upper-snake
/// strings the API sends — `unknown` is a client-only fallback for forward
/// compatibility with values this build doesn't know about yet.
enum UserType {
  customer,
  rentalPartner,
  admin,
  superAdmin,
  unknown;

  static UserType fromJson(String? value) => switch (value) {
        "CUSTOMER" => UserType.customer,
        "RENTAL_PARTNER" => UserType.rentalPartner,
        "ADMIN" => UserType.admin,
        "SUPER_ADMIN" => UserType.superAdmin,
        _ => UserType.unknown,
      };

  String toJson() => switch (this) {
        UserType.customer => "CUSTOMER",
        UserType.rentalPartner => "RENTAL_PARTNER",
        UserType.admin => "ADMIN",
        UserType.superAdmin => "SUPER_ADMIN",
        UserType.unknown => "UNKNOWN",
      };
}

enum AccountStatus {
  pendingVerification,
  active,
  suspended,
  banned,
  unknown;

  static AccountStatus fromJson(String? value) => switch (value) {
        "PENDING_VERIFICATION" => AccountStatus.pendingVerification,
        "ACTIVE" => AccountStatus.active,
        "SUSPENDED" => AccountStatus.suspended,
        "BANNED" => AccountStatus.banned,
        _ => AccountStatus.unknown,
      };

  String toJson() => switch (this) {
        AccountStatus.pendingVerification => "PENDING_VERIFICATION",
        AccountStatus.active => "ACTIVE",
        AccountStatus.suspended => "SUSPENDED",
        AccountStatus.banned => "BANNED",
        AccountStatus.unknown => "UNKNOWN",
      };
}

enum PartnerVerificationStatus {
  pending,
  underReview,
  verified,
  rejected,
  unknown;

  static PartnerVerificationStatus fromJson(String? value) => switch (value) {
        "PENDING" => PartnerVerificationStatus.pending,
        "UNDER_REVIEW" => PartnerVerificationStatus.underReview,
        "VERIFIED" => PartnerVerificationStatus.verified,
        "REJECTED" => PartnerVerificationStatus.rejected,
        _ => PartnerVerificationStatus.unknown,
      };

  String toJson() => switch (this) {
        PartnerVerificationStatus.pending => "PENDING",
        PartnerVerificationStatus.underReview => "UNDER_REVIEW",
        PartnerVerificationStatus.verified => "VERIFIED",
        PartnerVerificationStatus.rejected => "REJECTED",
        PartnerVerificationStatus.unknown => "UNKNOWN",
      };
}

enum DocumentType {
  businessLicense,
  gstCertificate,
  identityProof,
  addressProof,
  bankProof,
  other;

  static DocumentType fromJson(String? value) => switch (value) {
        "BUSINESS_LICENSE" => DocumentType.businessLicense,
        "GST_CERTIFICATE" => DocumentType.gstCertificate,
        "IDENTITY_PROOF" => DocumentType.identityProof,
        "ADDRESS_PROOF" => DocumentType.addressProof,
        "BANK_PROOF" => DocumentType.bankProof,
        _ => DocumentType.other,
      };

  String toJson() => switch (this) {
        DocumentType.businessLicense => "BUSINESS_LICENSE",
        DocumentType.gstCertificate => "GST_CERTIFICATE",
        DocumentType.identityProof => "IDENTITY_PROOF",
        DocumentType.addressProof => "ADDRESS_PROOF",
        DocumentType.bankProof => "BANK_PROOF",
        DocumentType.other => "OTHER",
      };
}

enum DocumentStatus {
  pending,
  approved,
  rejected,
  unknown;

  static DocumentStatus fromJson(String? value) => switch (value) {
        "PENDING" => DocumentStatus.pending,
        "APPROVED" => DocumentStatus.approved,
        "REJECTED" => DocumentStatus.rejected,
        _ => DocumentStatus.unknown,
      };

  String toJson() => switch (this) {
        DocumentStatus.pending => "PENDING",
        DocumentStatus.approved => "APPROVED",
        DocumentStatus.rejected => "REJECTED",
        DocumentStatus.unknown => "UNKNOWN",
      };
}

enum VehicleApprovalStatus {
  pending,
  approved,
  rejected,
  unknown;

  static VehicleApprovalStatus fromJson(String? value) => switch (value) {
        "PENDING" => VehicleApprovalStatus.pending,
        "APPROVED" => VehicleApprovalStatus.approved,
        "REJECTED" => VehicleApprovalStatus.rejected,
        _ => VehicleApprovalStatus.unknown,
      };

  String toJson() => switch (this) {
        VehicleApprovalStatus.pending => "PENDING",
        VehicleApprovalStatus.approved => "APPROVED",
        VehicleApprovalStatus.rejected => "REJECTED",
        VehicleApprovalStatus.unknown => "UNKNOWN",
      };
}

enum VehicleTransmission {
  manual,
  automatic;

  static VehicleTransmission fromJson(String? value) =>
      value == "AUTOMATIC" ? VehicleTransmission.automatic : VehicleTransmission.manual;

  String toJson() => this == VehicleTransmission.automatic ? "AUTOMATIC" : "MANUAL";

  String get label => this == VehicleTransmission.automatic ? "Automatic" : "Manual";
}

enum FuelType {
  petrol,
  diesel,
  electric,
  hybrid,
  cng;

  static FuelType fromJson(String? value) => switch (value) {
        "DIESEL" => FuelType.diesel,
        "ELECTRIC" => FuelType.electric,
        "HYBRID" => FuelType.hybrid,
        "CNG" => FuelType.cng,
        _ => FuelType.petrol,
      };

  String toJson() => switch (this) {
        FuelType.petrol => "PETROL",
        FuelType.diesel => "DIESEL",
        FuelType.electric => "ELECTRIC",
        FuelType.hybrid => "HYBRID",
        FuelType.cng => "CNG",
      };

  String get label => switch (this) {
        FuelType.petrol => "Petrol",
        FuelType.diesel => "Diesel",
        FuelType.electric => "Electric",
        FuelType.hybrid => "Hybrid",
        FuelType.cng => "CNG",
      };
}

/// Ordered to match the visual booking-status timeline (public-site's
/// BookingStatusTimeline). CANCELLED/REJECTED are terminal branches, not steps.
enum BookingStatus {
  pending,
  confirmed,
  approved,
  rejected,
  vehicleReady,
  pickedUp,
  active,
  returning,
  completed,
  cancelled,
  unknown;

  static BookingStatus fromJson(String? value) => switch (value) {
        "PENDING" => BookingStatus.pending,
        "CONFIRMED" => BookingStatus.confirmed,
        "APPROVED" => BookingStatus.approved,
        "REJECTED" => BookingStatus.rejected,
        "VEHICLE_READY" => BookingStatus.vehicleReady,
        "PICKED_UP" => BookingStatus.pickedUp,
        "ACTIVE" => BookingStatus.active,
        "RETURNING" => BookingStatus.returning,
        "COMPLETED" => BookingStatus.completed,
        "CANCELLED" => BookingStatus.cancelled,
        _ => BookingStatus.unknown,
      };

  String toJson() => switch (this) {
        BookingStatus.pending => "PENDING",
        BookingStatus.confirmed => "CONFIRMED",
        BookingStatus.approved => "APPROVED",
        BookingStatus.rejected => "REJECTED",
        BookingStatus.vehicleReady => "VEHICLE_READY",
        BookingStatus.pickedUp => "PICKED_UP",
        BookingStatus.active => "ACTIVE",
        BookingStatus.returning => "RETURNING",
        BookingStatus.completed => "COMPLETED",
        BookingStatus.cancelled => "CANCELLED",
        BookingStatus.unknown => "UNKNOWN",
      };

  String get label => switch (this) {
        BookingStatus.pending => "Pending",
        BookingStatus.confirmed => "Confirmed",
        BookingStatus.approved => "Approved",
        BookingStatus.rejected => "Rejected",
        BookingStatus.vehicleReady => "Vehicle Ready",
        BookingStatus.pickedUp => "Picked Up",
        BookingStatus.active => "Active",
        BookingStatus.returning => "Returning",
        BookingStatus.completed => "Completed",
        BookingStatus.cancelled => "Cancelled",
        BookingStatus.unknown => "Unknown",
      };

  bool get isTerminalNegative => this == BookingStatus.rejected || this == BookingStatus.cancelled;
}

enum PaymentStatus {
  pending,
  authorized,
  paid,
  failed,
  refunded,
  partiallyRefunded,
  unknown;

  static PaymentStatus fromJson(String? value) => switch (value) {
        "PENDING" => PaymentStatus.pending,
        "AUTHORIZED" => PaymentStatus.authorized,
        "PAID" => PaymentStatus.paid,
        "FAILED" => PaymentStatus.failed,
        "REFUNDED" => PaymentStatus.refunded,
        "PARTIALLY_REFUNDED" => PaymentStatus.partiallyRefunded,
        _ => PaymentStatus.unknown,
      };

  String toJson() => switch (this) {
        PaymentStatus.pending => "PENDING",
        PaymentStatus.authorized => "AUTHORIZED",
        PaymentStatus.paid => "PAID",
        PaymentStatus.failed => "FAILED",
        PaymentStatus.refunded => "REFUNDED",
        PaymentStatus.partiallyRefunded => "PARTIALLY_REFUNDED",
        PaymentStatus.unknown => "UNKNOWN",
      };
}

enum PaymentProvider {
  razorpay,
  stripe,
  wallet;

  static PaymentProvider fromJson(String? value) => switch (value) {
        "RAZORPAY" => PaymentProvider.razorpay,
        "STRIPE" => PaymentProvider.stripe,
        _ => PaymentProvider.wallet,
      };

  String toJson() => switch (this) {
        PaymentProvider.razorpay => "RAZORPAY",
        PaymentProvider.stripe => "STRIPE",
        PaymentProvider.wallet => "WALLET",
      };
}

enum TransactionType {
  bookingPayment,
  refund,
  payout,
  walletTopup,
  walletDebit,
  commission,
  unknown;

  static TransactionType fromJson(String? value) => switch (value) {
        "BOOKING_PAYMENT" => TransactionType.bookingPayment,
        "REFUND" => TransactionType.refund,
        "PAYOUT" => TransactionType.payout,
        "WALLET_TOPUP" => TransactionType.walletTopup,
        "WALLET_DEBIT" => TransactionType.walletDebit,
        "COMMISSION" => TransactionType.commission,
        _ => TransactionType.unknown,
      };

  String get label => switch (this) {
        TransactionType.bookingPayment => "Booking payment",
        TransactionType.refund => "Refund",
        TransactionType.payout => "Payout",
        TransactionType.walletTopup => "Wallet top-up",
        TransactionType.walletDebit => "Wallet debit",
        TransactionType.commission => "Commission",
        TransactionType.unknown => "Transaction",
      };
}

enum TransactionStatus {
  pending,
  success,
  failed,
  unknown;

  static TransactionStatus fromJson(String? value) => switch (value) {
        "PENDING" => TransactionStatus.pending,
        "SUCCESS" => TransactionStatus.success,
        "FAILED" => TransactionStatus.failed,
        _ => TransactionStatus.unknown,
      };
}

enum NotificationChannel {
  inApp,
  email,
  push,
  sms,
  unknown;

  static NotificationChannel fromJson(String? value) => switch (value) {
        "IN_APP" => NotificationChannel.inApp,
        "EMAIL" => NotificationChannel.email,
        "PUSH" => NotificationChannel.push,
        "SMS" => NotificationChannel.sms,
        _ => NotificationChannel.unknown,
      };
}

enum SupportTicketStatus {
  open,
  inProgress,
  resolved,
  closed,
  unknown;

  static SupportTicketStatus fromJson(String? value) => switch (value) {
        "OPEN" => SupportTicketStatus.open,
        "IN_PROGRESS" => SupportTicketStatus.inProgress,
        "RESOLVED" => SupportTicketStatus.resolved,
        "CLOSED" => SupportTicketStatus.closed,
        _ => SupportTicketStatus.unknown,
      };

  String toJson() => switch (this) {
        SupportTicketStatus.open => "OPEN",
        SupportTicketStatus.inProgress => "IN_PROGRESS",
        SupportTicketStatus.resolved => "RESOLVED",
        SupportTicketStatus.closed => "CLOSED",
        SupportTicketStatus.unknown => "UNKNOWN",
      };

  String get label => switch (this) {
        SupportTicketStatus.open => "Open",
        SupportTicketStatus.inProgress => "In progress",
        SupportTicketStatus.resolved => "Resolved",
        SupportTicketStatus.closed => "Closed",
        SupportTicketStatus.unknown => "Unknown",
      };
}

enum CouponType {
  flat,
  percentage;

  static CouponType fromJson(String? value) => value == "PERCENTAGE" ? CouponType.percentage : CouponType.flat;

  String toJson() => this == CouponType.percentage ? "PERCENTAGE" : "FLAT";
}

enum DrivingLicenseStatus {
  pending,
  verified,
  rejected,
  unknown;

  static DrivingLicenseStatus fromJson(String? value) => switch (value) {
        "PENDING" => DrivingLicenseStatus.pending,
        "VERIFIED" => DrivingLicenseStatus.verified,
        "REJECTED" => DrivingLicenseStatus.rejected,
        _ => DrivingLicenseStatus.unknown,
      };

  String toJson() => switch (this) {
        DrivingLicenseStatus.pending => "PENDING",
        DrivingLicenseStatus.verified => "VERIFIED",
        DrivingLicenseStatus.rejected => "REJECTED",
        DrivingLicenseStatus.unknown => "UNKNOWN",
      };
}
