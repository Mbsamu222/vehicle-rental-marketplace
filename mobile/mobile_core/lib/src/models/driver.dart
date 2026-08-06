import '../utils/json_helpers.dart';
import 'catalog.dart';
import 'user.dart';

enum DriverVerificationStatus {
  pending,
  underReview,
  verified,
  rejected,
  suspended,
  unknown;

  static DriverVerificationStatus fromJson(String? value) => switch (value) {
        "PENDING" => DriverVerificationStatus.pending,
        "UNDER_REVIEW" => DriverVerificationStatus.underReview,
        "VERIFIED" => DriverVerificationStatus.verified,
        "REJECTED" => DriverVerificationStatus.rejected,
        "SUSPENDED" => DriverVerificationStatus.suspended,
        _ => DriverVerificationStatus.unknown,
      };

  String get label => switch (this) {
        DriverVerificationStatus.pending => "Pending",
        DriverVerificationStatus.underReview => "Under review",
        DriverVerificationStatus.verified => "Verified",
        DriverVerificationStatus.rejected => "Rejected",
        DriverVerificationStatus.suspended => "Suspended",
        DriverVerificationStatus.unknown => "Unknown",
      };
}

enum DriverAssignmentStatus {
  requested,
  accepted,
  declined,
  cancelled,
  completed,
  unknown;

  static DriverAssignmentStatus fromJson(String? value) => switch (value) {
        "REQUESTED" => DriverAssignmentStatus.requested,
        "ACCEPTED" => DriverAssignmentStatus.accepted,
        "DECLINED" => DriverAssignmentStatus.declined,
        "CANCELLED" => DriverAssignmentStatus.cancelled,
        "COMPLETED" => DriverAssignmentStatus.completed,
        _ => DriverAssignmentStatus.unknown,
      };

  String get label => switch (this) {
        DriverAssignmentStatus.requested => "Requested",
        DriverAssignmentStatus.accepted => "Accepted",
        DriverAssignmentStatus.declined => "Declined",
        DriverAssignmentStatus.cancelled => "Cancelled",
        DriverAssignmentStatus.completed => "Completed",
        DriverAssignmentStatus.unknown => "Unknown",
      };
}

class Driver {
  final String id;
  final String userId;
  final String cityId;
  final String licenseNumber;
  final DateTime? licenseExpiry;
  final int yearsOfExperience;
  final double dailyRate;
  final double hourlyRate;
  final String? bio;
  final String? photoUrl;
  final String? languages;
  final DriverVerificationStatus verificationStatus;
  final String? rejectionReason;
  final bool isAvailable;
  final double averageRating;
  final int totalTrips;
  final int totalReviews;

  /// Only present on the availability search — the price for the requested
  /// window, not a day rate.
  final double? quotedAmount;
  final AppUser? user;
  final City? city;

  Driver({
    required this.id,
    required this.userId,
    required this.cityId,
    required this.licenseNumber,
    this.licenseExpiry,
    required this.yearsOfExperience,
    required this.dailyRate,
    required this.hourlyRate,
    this.bio,
    this.photoUrl,
    this.languages,
    required this.verificationStatus,
    this.rejectionReason,
    required this.isAvailable,
    required this.averageRating,
    required this.totalTrips,
    required this.totalReviews,
    this.quotedAmount,
    this.user,
    this.city,
  });

  String get displayName =>
      user == null ? "Driver" : "${user!.firstName} ${user!.lastName}".trim();

  factory Driver.fromJson(Map<String, dynamic> json) => Driver(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        cityId: asString(json["cityId"]),
        licenseNumber: asString(json["licenseNumber"]),
        licenseExpiry: asDateOrNull(json["licenseExpiry"]),
        yearsOfExperience: asInt(json["yearsOfExperience"]),
        dailyRate: asDouble(json["dailyRate"]),
        hourlyRate: asDouble(json["hourlyRate"]),
        bio: asStringOrNull(json["bio"]),
        photoUrl: asStringOrNull(json["photoUrl"]),
        languages: asStringOrNull(json["languages"]),
        verificationStatus: DriverVerificationStatus.fromJson(asStringOrNull(json["verificationStatus"])),
        rejectionReason: asStringOrNull(json["rejectionReason"]),
        isAvailable: asBool(json["isAvailable"], true),
        averageRating: asDouble(json["averageRating"]),
        totalTrips: asInt(json["totalTrips"]),
        totalReviews: asInt(json["totalReviews"]),
        quotedAmount: asDoubleOrNull(json["quotedAmount"]),
        user: asMapOrNull(json["user"]) != null ? AppUser.fromJson(asMapOrNull(json["user"])!) : null,
        city: asMapOrNull(json["city"]) != null ? City.fromJson(asMapOrNull(json["city"])!) : null,
      );
}

class DriverAssignment {
  final String id;
  final String bookingId;
  final String driverId;
  final DriverAssignmentStatus status;
  final double agreedAmount;
  final String? declineReason;
  final DateTime? respondedAt;
  final DateTime createdAt;

  DriverAssignment({
    required this.id,
    required this.bookingId,
    required this.driverId,
    required this.status,
    required this.agreedAmount,
    this.declineReason,
    this.respondedAt,
    required this.createdAt,
  });

  factory DriverAssignment.fromJson(Map<String, dynamic> json) => DriverAssignment(
        id: asString(json["id"]),
        bookingId: asString(json["bookingId"]),
        driverId: asString(json["driverId"]),
        status: DriverAssignmentStatus.fromJson(asStringOrNull(json["status"])),
        agreedAmount: asDouble(json["agreedAmount"]),
        declineReason: asStringOrNull(json["declineReason"]),
        respondedAt: asDateOrNull(json["respondedAt"]),
        createdAt: asDate(json["createdAt"]),
      );
}
