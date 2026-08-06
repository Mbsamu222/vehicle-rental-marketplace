import 'enums.dart';
import '../utils/json_helpers.dart';

class Coupon {
  final String id;
  final String code;
  final CouponType type;
  final double value;
  final double? maxDiscount;
  final double? minBookingValue;
  final int? usageLimit;
  final int usageCount;
  final int perUserLimit;
  final DateTime validFrom;
  final DateTime validUntil;
  final bool isActive;

  Coupon({
    required this.id,
    required this.code,
    required this.type,
    required this.value,
    this.maxDiscount,
    this.minBookingValue,
    this.usageLimit,
    required this.usageCount,
    required this.perUserLimit,
    required this.validFrom,
    required this.validUntil,
    required this.isActive,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) => Coupon(
        id: asString(json["id"]),
        code: asString(json["code"]),
        type: CouponType.fromJson(asStringOrNull(json["type"])),
        value: asDouble(json["value"]),
        maxDiscount: asDoubleOrNull(json["maxDiscount"]),
        minBookingValue: asDoubleOrNull(json["minBookingValue"]),
        usageLimit: asIntOrNull(json["usageLimit"]),
        usageCount: asInt(json["usageCount"]),
        perUserLimit: asInt(json["perUserLimit"], 1),
        validFrom: asDate(json["validFrom"]),
        validUntil: asDate(json["validUntil"]),
        isActive: asBool(json["isActive"], true),
      );
}

class CouponValidationResult {
  final bool valid;
  final double discountAmount;
  final String? message;

  CouponValidationResult({required this.valid, required this.discountAmount, this.message});

  factory CouponValidationResult.fromJson(Map<String, dynamic> json) => CouponValidationResult(
        valid: asBool(json["valid"], true),
        discountAmount: asDouble(json["discountAmount"]),
        message: asStringOrNull(json["message"]),
      );
}
