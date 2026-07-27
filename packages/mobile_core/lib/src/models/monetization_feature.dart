import '../utils/json_helpers.dart';

/// One revenue mechanism the admin can switch on, with a JSON config blob for
/// its parameters. Mirrors backend/app/db/models.py::MonetizationFeature —
/// every module that computes a fee checks its row first, so a disabled
/// feature means "behave as if it doesn't exist".
class MonetizationFeature {
  final String id;
  final String key;
  final bool isEnabled;
  final Map<String, dynamic> config;
  final DateTime? updatedAt;

  MonetizationFeature({
    required this.id,
    required this.key,
    required this.isEnabled,
    this.config = const {},
    this.updatedAt,
  });

  /// Same labels and descriptions admin-web's MonetizationPage renders, so the
  /// two consoles describe each toggle identically.
  ({String label, String description}) get info => switch (key) {
        "BOOKING_COMMISSION" => (
            label: "Booking commission",
            description: "Platform's cut of each completed booking, at the partner's commission rate.",
          ),
        "PAYOUT_FEE" => (
            label: "Payout / settlement fee",
            description: "Fee deducted from a partner payout, separate from commission.",
          ),
        "SERVICE_FEE" => (
            label: "Per-booking service fee",
            description: "Convenience fee added to the customer's checkout total.",
          ),
        "EXTRA_DRIVER_FEE" => (
            label: "Extra-driver surcharge",
            description: "Fee per additional driver declared at booking time.",
          ),
        "YOUNG_DRIVER_FEE" => (
            label: "Young-driver surcharge",
            description: "Flat fee when the customer self-declares as a young driver.",
          ),
        "LATE_RETURN_FEE" => (
            label: "Late-return fee",
            description: "Fee for returning a vehicle after the scheduled return time.",
          ),
        "CANCELLATION_FEE" => (
            label: "Cancellation fee",
            description:
                "Tiered fee deducted from a refund based on how close to pickup the booking is cancelled.",
          ),
        "BOOSTED_LISTINGS" => (
            label: "Boosted / featured listings",
            description: "Partners pay to rank their vehicles first in search and on the homepage.",
          ),
        "SPONSORED_PLACEMENTS" => (
            label: "Sponsored placements",
            description: "Paid placement in hero banners and the sponsors grid.",
          ),
        "AFFILIATE_PROGRAM" => (
            label: "Affiliate program",
            description: "Referral partners (insurance, roadside assistance, fuel) shown to customers.",
          ),
        "PARTNER_SUBSCRIPTIONS" => (
            label: "Partner subscription tiers",
            description: "Recurring plans that unlock more vehicles, lower commission, or analytics.",
          ),
        "FLEET_ANALYTICS" => (
            label: "Fleet analytics (paid add-on)",
            description: "Utilization and demand insights, gated behind a subscription plan feature.",
          ),
        _ => (label: key, description: ""),
      };

  factory MonetizationFeature.fromJson(Map<String, dynamic> json) => MonetizationFeature(
        id: asString(json["id"]),
        key: asString(json["key"]),
        isEnabled: asBool(json["isEnabled"]),
        config: asMapOrNull(json["config"]) ?? const {},
        updatedAt: asDateOrNull(json["updatedAt"]),
      );
}
