import 'coupon.dart';
import 'enums.dart';
import 'payment.dart';
import 'rental_partner.dart';
import 'user.dart';
import 'vehicle.dart';
import '../utils/json_helpers.dart';

class BookingStatusHistoryEntry {
  final String id;
  final String bookingId;
  final BookingStatus status;
  final String? note;
  final String? changedById;
  final DateTime createdAt;

  BookingStatusHistoryEntry({
    required this.id,
    required this.bookingId,
    required this.status,
    this.note,
    this.changedById,
    required this.createdAt,
  });

  factory BookingStatusHistoryEntry.fromJson(Map<String, dynamic> json) => BookingStatusHistoryEntry(
        id: asString(json["id"]),
        bookingId: asString(json["bookingId"]),
        status: BookingStatus.fromJson(asStringOrNull(json["status"])),
        note: asStringOrNull(json["note"]),
        changedById: asStringOrNull(json["changedById"]),
        createdAt: asDate(json["createdAt"]),
      );
}

class Invoice {
  final String id;
  final String bookingId;
  final String invoiceNumber;
  final String? pdfUrl;
  final DateTime issuedAt;

  Invoice({required this.id, required this.bookingId, required this.invoiceNumber, this.pdfUrl, required this.issuedAt});

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id: asString(json["id"]),
        bookingId: asString(json["bookingId"]),
        invoiceNumber: asString(json["invoiceNumber"]),
        pdfUrl: asStringOrNull(json["pdfUrl"]),
        issuedAt: asDate(json["issuedAt"]),
      );
}

class Booking {
  final String id;
  final String bookingNumber;
  final String customerId;
  final String vehicleId;
  final String rentalPartnerId;
  final String? drivingLicenseId;
  final String? couponId;
  final DateTime pickupDatetime;
  final DateTime returnDatetime;
  final String pickupLocation;
  final String returnLocation;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final double? returnLatitude;
  final double? returnLongitude;
  final double basePrice;
  final double discountAmount;
  final double taxAmount;
  final double securityDeposit;
  final double totalAmount;
  final bool withDriver;
  final BookingStatus status;
  final String? cancellationReason;
  final DateTime createdAt;
  final Vehicle? vehicle;
  final RentalPartner? rentalPartner;
  final AppUser? customer;
  final List<BookingStatusHistoryEntry> statusHistory;
  final List<Payment> payments;
  final Invoice? invoice;
  final Coupon? coupon;

  Booking({
    required this.id,
    required this.bookingNumber,
    required this.customerId,
    required this.vehicleId,
    required this.rentalPartnerId,
    this.drivingLicenseId,
    this.couponId,
    required this.pickupDatetime,
    required this.returnDatetime,
    required this.pickupLocation,
    required this.returnLocation,
    this.pickupLatitude,
    this.pickupLongitude,
    this.returnLatitude,
    this.returnLongitude,
    required this.basePrice,
    required this.discountAmount,
    required this.taxAmount,
    required this.securityDeposit,
    required this.totalAmount,
    this.withDriver = false,
    required this.status,
    this.cancellationReason,
    required this.createdAt,
    this.vehicle,
    this.rentalPartner,
    this.customer,
    this.statusHistory = const [],
    this.payments = const [],
    this.invoice,
    this.coupon,
  });

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: asString(json["id"]),
        bookingNumber: asString(json["bookingNumber"]),
        customerId: asString(json["customerId"]),
        vehicleId: asString(json["vehicleId"]),
        rentalPartnerId: asString(json["rentalPartnerId"]),
        drivingLicenseId: asStringOrNull(json["drivingLicenseId"]),
        couponId: asStringOrNull(json["couponId"]),
        pickupDatetime: asDate(json["pickupDatetime"]),
        returnDatetime: asDate(json["returnDatetime"]),
        pickupLocation: asString(json["pickupLocation"]),
        returnLocation: asString(json["returnLocation"]),
        pickupLatitude: asDoubleOrNull(json["pickupLatitude"]),
        pickupLongitude: asDoubleOrNull(json["pickupLongitude"]),
        returnLatitude: asDoubleOrNull(json["returnLatitude"]),
        returnLongitude: asDoubleOrNull(json["returnLongitude"]),
        basePrice: asDouble(json["basePrice"]),
        discountAmount: asDouble(json["discountAmount"]),
        taxAmount: asDouble(json["taxAmount"]),
        securityDeposit: asDouble(json["securityDeposit"]),
        totalAmount: asDouble(json["totalAmount"]),
        withDriver: asBool(json["withDriver"]),
        status: BookingStatus.fromJson(asStringOrNull(json["status"])),
        cancellationReason: asStringOrNull(json["cancellationReason"]),
        createdAt: asDate(json["createdAt"]),
        vehicle: asMapOrNull(json["vehicle"]) != null ? Vehicle.fromJson(asMapOrNull(json["vehicle"])!) : null,
        rentalPartner: asMapOrNull(json["rentalPartner"]) != null
            ? RentalPartner.fromJson(asMapOrNull(json["rentalPartner"])!)
            : null,
        customer: asMapOrNull(json["customer"]) != null ? AppUser.fromJson(asMapOrNull(json["customer"])!) : null,
        statusHistory: asMapList(json["statusHistory"]).map(BookingStatusHistoryEntry.fromJson).toList(),
        payments: asMapList(json["payments"]).map(Payment.fromJson).toList(),
        invoice: asMapOrNull(json["invoice"]) != null ? Invoice.fromJson(asMapOrNull(json["invoice"])!) : null,
        coupon: asMapOrNull(json["coupon"]) != null ? Coupon.fromJson(asMapOrNull(json["coupon"])!) : null,
      );
}
