import 'enums.dart';
import '../utils/json_helpers.dart';

class AppUser {
  final String id;
  final String email;
  final String? phone;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final UserType userType;
  final AccountStatus accountStatus;
  final DateTime? emailVerifiedAt;
  final DateTime? phoneVerifiedAt;
  final String? referralCode;
  final int loyaltyPoints;
  final DateTime createdAt;

  AppUser({
    required this.id,
    required this.email,
    this.phone,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    required this.userType,
    required this.accountStatus,
    this.emailVerifiedAt,
    this.phoneVerifiedAt,
    this.referralCode,
    required this.loyaltyPoints,
    required this.createdAt,
  });

  String get fullName => "$firstName $lastName".trim();

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: asString(json["id"]),
        email: asString(json["email"]),
        phone: asStringOrNull(json["phone"]),
        firstName: asString(json["firstName"]),
        lastName: asString(json["lastName"]),
        avatarUrl: asStringOrNull(json["avatarUrl"]),
        userType: UserType.fromJson(asStringOrNull(json["userType"])),
        accountStatus: AccountStatus.fromJson(asStringOrNull(json["accountStatus"])),
        emailVerifiedAt: asDateOrNull(json["emailVerifiedAt"]),
        phoneVerifiedAt: asDateOrNull(json["phoneVerifiedAt"]),
        referralCode: asStringOrNull(json["referralCode"]),
        loyaltyPoints: asInt(json["loyaltyPoints"]),
        createdAt: asDate(json["createdAt"]),
      );
}

class DrivingLicense {
  final String id;
  final String userId;
  final String licenseNumber;
  final String frontImageUrl;
  final String? backImageUrl;
  final DateTime expiryDate;
  final DrivingLicenseStatus status;
  final String? rejectionReason;
  final DateTime? verifiedAt;
  final DateTime createdAt;
  final AppUser? user;

  DrivingLicense({
    required this.id,
    required this.userId,
    required this.licenseNumber,
    required this.frontImageUrl,
    this.backImageUrl,
    required this.expiryDate,
    required this.status,
    this.rejectionReason,
    this.verifiedAt,
    required this.createdAt,
    this.user,
  });

  factory DrivingLicense.fromJson(Map<String, dynamic> json) => DrivingLicense(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        licenseNumber: asString(json["licenseNumber"]),
        frontImageUrl: asString(json["frontImageUrl"]),
        backImageUrl: asStringOrNull(json["backImageUrl"]),
        expiryDate: asDate(json["expiryDate"]),
        status: DrivingLicenseStatus.fromJson(asStringOrNull(json["status"])),
        rejectionReason: asStringOrNull(json["rejectionReason"]),
        verifiedAt: asDateOrNull(json["verifiedAt"]),
        createdAt: asDate(json["createdAt"]),
        user: asMapOrNull(json["user"]) != null ? AppUser.fromJson(asMapOrNull(json["user"])!) : null,
      );
}

class SavedLocation {
  final String id;
  final String userId;
  final String cityId;
  final String label;
  final String address;
  final double? latitude;
  final double? longitude;

  SavedLocation({
    required this.id,
    required this.userId,
    required this.cityId,
    required this.label,
    required this.address,
    this.latitude,
    this.longitude,
  });

  factory SavedLocation.fromJson(Map<String, dynamic> json) => SavedLocation(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        cityId: asString(json["cityId"]),
        label: asString(json["label"]),
        address: asString(json["address"]),
        latitude: asDoubleOrNull(json["latitude"]),
        longitude: asDoubleOrNull(json["longitude"]),
      );
}
