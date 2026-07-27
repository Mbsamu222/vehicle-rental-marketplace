import '../utils/json_helpers.dart';

/// Partner subscription plans and the partner's own subscription. Mirrors
/// backend/app/modules/subscriptions/router.py.
enum SubscriptionStatus {
  pending,
  active,
  expired,
  cancelled,
  unknown;

  static SubscriptionStatus fromJson(String? value) => switch (value) {
        "PENDING" => SubscriptionStatus.pending,
        "ACTIVE" => SubscriptionStatus.active,
        "EXPIRED" => SubscriptionStatus.expired,
        "CANCELLED" => SubscriptionStatus.cancelled,
        _ => SubscriptionStatus.unknown,
      };

  String get label => switch (this) {
        SubscriptionStatus.pending => "Pending approval",
        SubscriptionStatus.active => "Active",
        SubscriptionStatus.expired => "Expired",
        SubscriptionStatus.cancelled => "Cancelled",
        SubscriptionStatus.unknown => "Unknown",
      };
}

class SubscriptionPlan {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int durationDays;

  /// null means "unlimited vehicles" on this plan.
  final int? maxVehicles;

  /// Feature flags the backend gates paid capabilities on — e.g. an
  /// `analytics: true` entry is what unlocks GET /rental-partners/me/analytics.
  final Map<String, dynamic> features;
  final bool isActive;

  SubscriptionPlan({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.durationDays,
    this.maxVehicles,
    this.features = const {},
    required this.isActive,
  });

  bool hasFeature(String key) => features[key] == true;

  /// Human-readable feature names for the plan card, matching how partner-web
  /// renders the same `features` map.
  List<String> get featureLabels =>
      features.entries.where((e) => e.value == true).map((e) => _humanize(e.key)).toList();

  static String _humanize(String key) {
    final spaced = key.replaceAllMapped(RegExp(r"(?<=[a-z])(?=[A-Z])"), (_) => " ").replaceAll("_", " ");
    return spaced.isEmpty ? spaced : spaced[0].toUpperCase() + spaced.substring(1);
  }

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => SubscriptionPlan(
        id: asString(json["id"]),
        name: asString(json["name"]),
        description: asStringOrNull(json["description"]),
        price: asDouble(json["price"]),
        durationDays: asInt(json["durationDays"]),
        maxVehicles: asIntOrNull(json["maxVehicles"]),
        features: asMapOrNull(json["features"]) ?? const {},
        isActive: asBool(json["isActive"], true),
      );
}

class PartnerSubscription {
  final String id;
  final String rentalPartnerId;
  final String planId;
  final SubscriptionStatus status;
  final DateTime? startedAt;
  final DateTime? expiresAt;
  final SubscriptionPlan? plan;

  PartnerSubscription({
    required this.id,
    required this.rentalPartnerId,
    required this.planId,
    required this.status,
    this.startedAt,
    this.expiresAt,
    this.plan,
  });

  factory PartnerSubscription.fromJson(Map<String, dynamic> json) => PartnerSubscription(
        id: asString(json["id"]),
        rentalPartnerId: asString(json["rentalPartnerId"]),
        planId: asString(json["planId"]),
        status: SubscriptionStatus.fromJson(asStringOrNull(json["status"])),
        startedAt: asDateOrNull(json["startedAt"]),
        expiresAt: asDateOrNull(json["expiresAt"]),
        plan: asMapOrNull(json["plan"]) != null ? SubscriptionPlan.fromJson(asMapOrNull(json["plan"])!) : null,
      );
}

/// GET /rental-partners/me/analytics. The endpoint 403s when fleet analytics
/// is disabled platform-wide or the partner's plan doesn't include it — the UI
/// treats that as "locked", not as an error.
class PartnerAnalytics {
  final int vehicleCount;
  final double utilizationPercent;
  final double averageRevenuePerVehicle;
  final List<TopVehicleStat> topVehicles;
  final List<CategoryDemandStat> categoryDemand;

  PartnerAnalytics({
    required this.vehicleCount,
    required this.utilizationPercent,
    required this.averageRevenuePerVehicle,
    required this.topVehicles,
    required this.categoryDemand,
  });

  factory PartnerAnalytics.fromJson(Map<String, dynamic> json) => PartnerAnalytics(
        vehicleCount: asInt(json["vehicleCount"]),
        utilizationPercent: asDouble(json["utilizationPercent"]),
        averageRevenuePerVehicle: asDouble(json["averageRevenuePerVehicle"]),
        topVehicles: (json["topVehicles"] as List? ?? const [])
            .whereType<Map>()
            .map((e) => TopVehicleStat.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
        categoryDemand: (json["categoryDemand"] as List? ?? const [])
            .whereType<Map>()
            .map((e) => CategoryDemandStat.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
      );
}

class TopVehicleStat {
  final String vehicleId;
  final String model;
  final double totalRevenue;
  final int totalBookings;

  TopVehicleStat({
    required this.vehicleId,
    required this.model,
    required this.totalRevenue,
    required this.totalBookings,
  });

  factory TopVehicleStat.fromJson(Map<String, dynamic> json) => TopVehicleStat(
        vehicleId: asString(json["vehicleId"]),
        model: asString(json["model"]),
        totalRevenue: asDouble(json["totalRevenue"]),
        totalBookings: asInt(json["totalBookings"]),
      );
}

class CategoryDemandStat {
  final String categoryName;
  final int bookingCount;

  CategoryDemandStat({required this.categoryName, required this.bookingCount});

  factory CategoryDemandStat.fromJson(Map<String, dynamic> json) => CategoryDemandStat(
        categoryName: asString(json["categoryName"]),
        bookingCount: asInt(json["bookingCount"]),
      );
}
