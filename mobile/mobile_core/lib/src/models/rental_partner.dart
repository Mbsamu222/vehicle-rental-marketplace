import 'catalog.dart';
import 'enums.dart';
import 'user.dart';
import '../utils/json_helpers.dart';

class BusinessDocument {
  final String id;
  final String rentalPartnerId;
  final DocumentType type;
  final String fileUrl;
  final DocumentStatus status;
  final String? rejectionReason;
  final DateTime uploadedAt;
  final DateTime? reviewedAt;

  BusinessDocument({
    required this.id,
    required this.rentalPartnerId,
    required this.type,
    required this.fileUrl,
    required this.status,
    this.rejectionReason,
    required this.uploadedAt,
    this.reviewedAt,
  });

  factory BusinessDocument.fromJson(Map<String, dynamic> json) => BusinessDocument(
        id: asString(json["id"]),
        rentalPartnerId: asString(json["rentalPartnerId"]),
        type: DocumentType.fromJson(asStringOrNull(json["type"])),
        fileUrl: asString(json["fileUrl"]),
        status: DocumentStatus.fromJson(asStringOrNull(json["status"])),
        rejectionReason: asStringOrNull(json["rejectionReason"]),
        uploadedAt: asDate(json["uploadedAt"]),
        reviewedAt: asDateOrNull(json["reviewedAt"]),
      );
}

class BankDetail {
  final String id;
  final String rentalPartnerId;
  final String accountHolder;
  final String accountNumber;
  final String ifscCode;
  final String bankName;
  final String? branch;
  final String? upiId;

  BankDetail({
    required this.id,
    required this.rentalPartnerId,
    required this.accountHolder,
    required this.accountNumber,
    required this.ifscCode,
    required this.bankName,
    this.branch,
    this.upiId,
  });

  factory BankDetail.fromJson(Map<String, dynamic> json) => BankDetail(
        id: asString(json["id"]),
        rentalPartnerId: asString(json["rentalPartnerId"]),
        accountHolder: asString(json["accountHolder"]),
        accountNumber: asString(json["accountNumber"]),
        ifscCode: asString(json["ifscCode"]),
        bankName: asString(json["bankName"]),
        branch: asStringOrNull(json["branch"]),
        upiId: asStringOrNull(json["upiId"]),
      );
}

class RentalPartner {
  final String id;
  final String userId;
  final String businessName;
  final String businessEmail;
  final String businessPhone;
  final String cityId;
  final String address;
  final double? latitude;
  final double? longitude;
  final String? logoUrl;
  final String? description;
  final PartnerVerificationStatus verificationStatus;
  final double commissionRate;
  final double averageRating;
  final int totalReviews;
  final DateTime createdAt;
  final City? city;
  final List<BusinessDocument> documents;
  final BankDetail? bankDetails;
  final AppUser? user;

  RentalPartner({
    required this.id,
    required this.userId,
    required this.businessName,
    required this.businessEmail,
    required this.businessPhone,
    required this.cityId,
    required this.address,
    this.latitude,
    this.longitude,
    this.logoUrl,
    this.description,
    required this.verificationStatus,
    required this.commissionRate,
    required this.averageRating,
    required this.totalReviews,
    required this.createdAt,
    this.city,
    this.documents = const [],
    this.bankDetails,
    this.user,
  });

  factory RentalPartner.fromJson(Map<String, dynamic> json) => RentalPartner(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        businessName: asString(json["businessName"]),
        businessEmail: asString(json["businessEmail"]),
        businessPhone: asString(json["businessPhone"]),
        cityId: asString(json["cityId"]),
        address: asString(json["address"]),
        latitude: asDoubleOrNull(json["latitude"]),
        longitude: asDoubleOrNull(json["longitude"]),
        logoUrl: asStringOrNull(json["logoUrl"]),
        description: asStringOrNull(json["description"]),
        verificationStatus: PartnerVerificationStatus.fromJson(asStringOrNull(json["verificationStatus"])),
        commissionRate: asDouble(json["commissionRate"]),
        averageRating: asDouble(json["averageRating"]),
        totalReviews: asInt(json["totalReviews"]),
        createdAt: asDate(json["createdAt"]),
        city: asMapOrNull(json["city"]) != null ? City.fromJson(asMapOrNull(json["city"])!) : null,
        documents: asMapList(json["documents"]).map(BusinessDocument.fromJson).toList(),
        bankDetails:
            asMapOrNull(json["bankDetails"]) != null ? BankDetail.fromJson(asMapOrNull(json["bankDetails"])!) : null,
        user: asMapOrNull(json["user"]) != null ? AppUser.fromJson(asMapOrNull(json["user"])!) : null,
      );
}

class PartnerDashboardStats {
  final int totalVehicles;
  final int activeBookings;
  final int pendingRequests;
  final int completedBookings;
  final double totalRevenue;
  final double averageRating;
  final PartnerVerificationStatus verificationStatus;

  PartnerDashboardStats({
    required this.totalVehicles,
    required this.activeBookings,
    required this.pendingRequests,
    required this.completedBookings,
    required this.totalRevenue,
    required this.averageRating,
    required this.verificationStatus,
  });

  factory PartnerDashboardStats.fromJson(Map<String, dynamic> json) => PartnerDashboardStats(
        totalVehicles: asInt(json["totalVehicles"]),
        activeBookings: asInt(json["activeBookings"]),
        pendingRequests: asInt(json["pendingRequests"]),
        completedBookings: asInt(json["completedBookings"]),
        totalRevenue: asDouble(json["totalRevenue"]),
        averageRating: asDouble(json["averageRating"]),
        verificationStatus: PartnerVerificationStatus.fromJson(asStringOrNull(json["verificationStatus"])),
      );
}
