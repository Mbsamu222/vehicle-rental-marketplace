import 'catalog.dart';
import 'enums.dart';
import 'rental_partner.dart';
import 'review.dart';
import '../utils/json_helpers.dart';

class VehicleImage {
  final String id;
  final String vehicleId;
  final String url;
  final bool isPrimary;
  final int sortOrder;

  VehicleImage({
    required this.id,
    required this.vehicleId,
    required this.url,
    required this.isPrimary,
    required this.sortOrder,
  });

  factory VehicleImage.fromJson(Map<String, dynamic> json) => VehicleImage(
        id: asString(json["id"]),
        vehicleId: asString(json["vehicleId"]),
        url: asString(json["url"]),
        isPrimary: asBool(json["isPrimary"]),
        sortOrder: asInt(json["sortOrder"]),
      );
}

class VehicleAvailabilityBlock {
  final String id;
  final String vehicleId;
  final DateTime startDate;
  final DateTime endDate;
  final String? reason;

  VehicleAvailabilityBlock({
    required this.id,
    required this.vehicleId,
    required this.startDate,
    required this.endDate,
    this.reason,
  });

  factory VehicleAvailabilityBlock.fromJson(Map<String, dynamic> json) => VehicleAvailabilityBlock(
        id: asString(json["id"]),
        vehicleId: asString(json["vehicleId"]),
        startDate: asDate(json["startDate"]),
        endDate: asDate(json["endDate"]),
        reason: asStringOrNull(json["reason"]),
      );
}

class Vehicle {
  final String id;
  final String rentalPartnerId;
  final String categoryId;
  final String brandId;
  final String cityId;
  final String model;
  final int year;
  final String registrationNumber;
  final VehicleTransmission transmission;
  final FuelType fuelType;
  final int seatingCapacity;
  final double pricePerHour;
  final double pricePerDay;
  final double securityDeposit;
  final String? insuranceDetails;
  final String? rentalPolicies;
  final double? latitude;
  final double? longitude;
  final VehicleApprovalStatus approvalStatus;
  final String? rejectionReason;
  final bool isActive;
  final double averageRating;
  final int totalReviews;
  final int totalBookings;
  final DateTime createdAt;
  final List<VehicleImage> images;
  final VehicleBrand? brand;
  final VehicleCategory? category;
  final City? city;
  final RentalPartner? rentalPartner;
  final List<Review> reviews;
  final List<VehicleAvailabilityBlock> availability;

  Vehicle({
    required this.id,
    required this.rentalPartnerId,
    required this.categoryId,
    required this.brandId,
    required this.cityId,
    required this.model,
    required this.year,
    required this.registrationNumber,
    required this.transmission,
    required this.fuelType,
    required this.seatingCapacity,
    required this.pricePerHour,
    required this.pricePerDay,
    required this.securityDeposit,
    this.insuranceDetails,
    this.rentalPolicies,
    this.latitude,
    this.longitude,
    required this.approvalStatus,
    this.rejectionReason,
    required this.isActive,
    required this.averageRating,
    required this.totalReviews,
    required this.totalBookings,
    required this.createdAt,
    this.images = const [],
    this.brand,
    this.category,
    this.city,
    this.rentalPartner,
    this.reviews = const [],
    this.availability = const [],
  });

  String? get primaryImageUrl {
    if (images.isEmpty) return null;
    final primary = images.where((i) => i.isPrimary).toList();
    return (primary.isNotEmpty ? primary.first : images.first).url;
  }

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: asString(json["id"]),
        rentalPartnerId: asString(json["rentalPartnerId"]),
        categoryId: asString(json["categoryId"]),
        brandId: asString(json["brandId"]),
        cityId: asString(json["cityId"]),
        model: asString(json["model"]),
        year: asInt(json["year"]),
        registrationNumber: asString(json["registrationNumber"]),
        transmission: VehicleTransmission.fromJson(asStringOrNull(json["transmission"])),
        fuelType: FuelType.fromJson(asStringOrNull(json["fuelType"])),
        seatingCapacity: asInt(json["seatingCapacity"]),
        pricePerHour: asDouble(json["pricePerHour"]),
        pricePerDay: asDouble(json["pricePerDay"]),
        securityDeposit: asDouble(json["securityDeposit"]),
        insuranceDetails: asStringOrNull(json["insuranceDetails"]),
        rentalPolicies: asStringOrNull(json["rentalPolicies"]),
        latitude: asDoubleOrNull(json["latitude"]),
        longitude: asDoubleOrNull(json["longitude"]),
        approvalStatus: VehicleApprovalStatus.fromJson(asStringOrNull(json["approvalStatus"])),
        rejectionReason: asStringOrNull(json["rejectionReason"]),
        isActive: asBool(json["isActive"], true),
        averageRating: asDouble(json["averageRating"]),
        totalReviews: asInt(json["totalReviews"]),
        totalBookings: asInt(json["totalBookings"]),
        createdAt: asDate(json["createdAt"]),
        images: asMapList(json["images"]).map(VehicleImage.fromJson).toList(),
        brand: asMapOrNull(json["brand"]) != null ? VehicleBrand.fromJson(asMapOrNull(json["brand"])!) : null,
        category:
            asMapOrNull(json["category"]) != null ? VehicleCategory.fromJson(asMapOrNull(json["category"])!) : null,
        city: asMapOrNull(json["city"]) != null ? City.fromJson(asMapOrNull(json["city"])!) : null,
        rentalPartner: asMapOrNull(json["rentalPartner"]) != null
            ? RentalPartner.fromJson(asMapOrNull(json["rentalPartner"])!)
            : null,
        reviews: asMapList(json["reviews"]).map(Review.fromJson).toList(),
        availability: asMapList(json["availability"]).map(VehicleAvailabilityBlock.fromJson).toList(),
      );
}
