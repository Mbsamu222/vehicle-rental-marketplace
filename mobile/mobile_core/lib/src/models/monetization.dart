import '../utils/json_helpers.dart';

/// Paid placements shown on the customer home screen. Both feeds are gated
/// server-side on their monetization toggle (backend/app/modules/catalog/
/// router.py) — a disabled feature returns `[]`, so the client never needs its
/// own gating logic and can't accidentally render placements the admin has
/// switched off.
class AdSlot {
  final String id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? ctaLabel;
  final String? ctaUrl;
  final String? sponsorName;
  final int sortOrder;
  final bool isActive;

  AdSlot({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.ctaLabel,
    this.ctaUrl,
    this.sponsorName,
    required this.sortOrder,
    required this.isActive,
  });

  factory AdSlot.fromJson(Map<String, dynamic> json) => AdSlot(
        id: asString(json["id"]),
        title: asString(json["title"]),
        subtitle: asStringOrNull(json["subtitle"]),
        imageUrl: asString(json["imageUrl"]),
        ctaLabel: asStringOrNull(json["ctaLabel"]),
        ctaUrl: asStringOrNull(json["ctaUrl"]),
        sponsorName: asStringOrNull(json["sponsorName"]),
        sortOrder: asInt(json["sortOrder"]),
        isActive: asBool(json["isActive"], true),
      );
}

enum AffiliateCategory { insurance, roadsideAssistance, fuel, other }

AffiliateCategory affiliateCategoryFromJson(Object? raw) => switch (asString(raw)) {
      "INSURANCE" => AffiliateCategory.insurance,
      "ROADSIDE_ASSISTANCE" => AffiliateCategory.roadsideAssistance,
      "FUEL" => AffiliateCategory.fuel,
      _ => AffiliateCategory.other,
    };

class AffiliatePartner {
  final String id;
  final String name;
  final AffiliateCategory category;
  final String? tagline;
  final String? ctaLabel;
  final String referralUrl;
  final String? logoUrl;
  final int sortOrder;
  final bool isActive;

  AffiliatePartner({
    required this.id,
    required this.name,
    required this.category,
    this.tagline,
    this.ctaLabel,
    required this.referralUrl,
    this.logoUrl,
    required this.sortOrder,
    required this.isActive,
  });

  factory AffiliatePartner.fromJson(Map<String, dynamic> json) => AffiliatePartner(
        id: asString(json["id"]),
        name: asString(json["name"]),
        category: affiliateCategoryFromJson(json["category"]),
        tagline: asStringOrNull(json["tagline"]),
        ctaLabel: asStringOrNull(json["ctaLabel"]),
        referralUrl: asString(json["referralUrl"]),
        logoUrl: asStringOrNull(json["logoUrl"]),
        sortOrder: asInt(json["sortOrder"]),
        isActive: asBool(json["isActive"], true),
      );
}
