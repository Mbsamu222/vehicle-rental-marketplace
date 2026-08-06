import '../utils/json_helpers.dart';

class Country {
  final String id;
  final String name;
  final String code;
  final bool isActive;

  Country({required this.id, required this.name, required this.code, required this.isActive});

  factory Country.fromJson(Map<String, dynamic> json) => Country(
        id: asString(json["id"]),
        name: asString(json["name"]),
        code: asString(json["code"]),
        isActive: asBool(json["isActive"], true),
      );
}

class City {
  final String id;
  final String name;
  final String countryId;
  final double? latitude;
  final double? longitude;
  final bool isPopular;
  final bool isActive;
  final String? imageUrl;
  final Country? country;

  City({
    required this.id,
    required this.name,
    required this.countryId,
    this.latitude,
    this.longitude,
    required this.isPopular,
    required this.isActive,
    this.imageUrl,
    this.country,
  });

  factory City.fromJson(Map<String, dynamic> json) => City(
        id: asString(json["id"]),
        name: asString(json["name"]),
        countryId: asString(json["countryId"]),
        latitude: asDoubleOrNull(json["latitude"]),
        longitude: asDoubleOrNull(json["longitude"]),
        isPopular: asBool(json["isPopular"]),
        isActive: asBool(json["isActive"], true),
        imageUrl: asStringOrNull(json["imageUrl"]),
        country: asMapOrNull(json["country"]) != null ? Country.fromJson(asMapOrNull(json["country"])!) : null,
      );
}

class VehicleCategory {
  final String id;
  final String name;
  final String slug;
  final String? iconUrl;
  final bool isActive;

  VehicleCategory({required this.id, required this.name, required this.slug, this.iconUrl, required this.isActive});

  factory VehicleCategory.fromJson(Map<String, dynamic> json) => VehicleCategory(
        id: asString(json["id"]),
        name: asString(json["name"]),
        slug: asString(json["slug"]),
        iconUrl: asStringOrNull(json["iconUrl"]),
        isActive: asBool(json["isActive"], true),
      );
}

class VehicleBrand {
  final String id;
  final String name;
  final String? logoUrl;
  final bool isActive;

  VehicleBrand({required this.id, required this.name, this.logoUrl, required this.isActive});

  factory VehicleBrand.fromJson(Map<String, dynamic> json) => VehicleBrand(
        id: asString(json["id"]),
        name: asString(json["name"]),
        logoUrl: asStringOrNull(json["logoUrl"]),
        isActive: asBool(json["isActive"], true),
      );
}

class CmsPage {
  final String slug;
  final String title;
  final String content;

  CmsPage({required this.slug, required this.title, required this.content});

  factory CmsPage.fromJson(Map<String, dynamic> json) => CmsPage(
        slug: asString(json["slug"]),
        title: asString(json["title"]),
        content: asString(json["content"]),
      );
}

class BlogPost {
  final String id;
  final String slug;
  final String title;
  final String? excerpt;
  final String content;
  final String? coverImageUrl;
  final String status;
  final DateTime? publishedAt;

  BlogPost({
    required this.id,
    required this.slug,
    required this.title,
    this.excerpt,
    required this.content,
    this.coverImageUrl,
    required this.status,
    this.publishedAt,
  });

  factory BlogPost.fromJson(Map<String, dynamic> json) => BlogPost(
        id: asString(json["id"]),
        slug: asString(json["slug"]),
        title: asString(json["title"]),
        excerpt: asStringOrNull(json["excerpt"]),
        content: asString(json["content"]),
        coverImageUrl: asStringOrNull(json["coverImageUrl"]),
        status: asString(json["status"]),
        publishedAt: asDateOrNull(json["publishedAt"]),
      );
}

class HeroBannerSlide {
  final String id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? ctaLabel;
  final String? ctaUrl;
  final int sortOrder;
  final bool isActive;

  HeroBannerSlide({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.ctaLabel,
    this.ctaUrl,
    required this.sortOrder,
    required this.isActive,
  });

  factory HeroBannerSlide.fromJson(Map<String, dynamic> json) => HeroBannerSlide(
        id: asString(json["id"]),
        title: asString(json["title"]),
        subtitle: asStringOrNull(json["subtitle"]),
        imageUrl: asString(json["imageUrl"]),
        ctaLabel: asStringOrNull(json["ctaLabel"]),
        ctaUrl: asStringOrNull(json["ctaUrl"]),
        sortOrder: asInt(json["sortOrder"]),
        isActive: asBool(json["isActive"], true),
      );
}
