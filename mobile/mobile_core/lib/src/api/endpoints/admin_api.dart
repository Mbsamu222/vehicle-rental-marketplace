import '../../models/admin.dart';
import '../../models/catalog.dart';
import '../../models/monetization.dart';
import '../../models/monetization_feature.dart';
import '../../models/pagination.dart';
import '../../models/user.dart';
import '../api_client.dart';

class AdminApi {
  final ApiClient _client;
  AdminApi(this._client);

  Future<AdminDashboardStats> dashboard() =>
      _client.get("/admin/dashboard", parse: (data) => AdminDashboardStats.fromJson(asJsonMap(data)));

  Future<List<Permission>> permissions() => _client.get(
        "/admin/permissions",
        parse: (data) => (data as List).map((e) => Permission.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<Role>> roles() => _client.get(
        "/admin/roles",
        parse: (data) => (data as List).map((e) => Role.fromJson(asJsonMap(e))).toList(),
      );

  Future<Role> createRole({required String name, String? description, List<String> permissionIds = const []}) =>
      _client.post(
        "/admin/roles",
        body: {"name": name, "description": ?description, "permissionIds": permissionIds},
        parse: (data) => Role.fromJson(asJsonMap(data)),
      );

  Future<Role> updateRole(String id, Map<String, dynamic> payload) =>
      _client.patch("/admin/roles/$id", body: payload, parse: (data) => Role.fromJson(asJsonMap(data)));

  Future<void> deleteRole(String id) => _client.delete("/admin/roles/$id", parse: asVoid);

  Future<void> assignRole(String userId, String roleId) =>
      _client.post("/admin/users/$userId/role", body: {"roleId": roleId}, parse: asVoid);

  Future<Paginated<AppUser>> users({String? userType, String? status, int page = 1, int limit = 20}) =>
      _client.getPaginated(
        "/admin/users",
        query: {"userType": userType, "status": status, "page": page, "limit": limit},
        parseItem: AppUser.fromJson,
      );

  Future<AppUser> userById(String id) => _client.get("/admin/users/$id", parse: (data) => AppUser.fromJson(asJsonMap(data)));

  Future<AppUser> updateUserStatus(String id, String status) => _client.patch(
        "/admin/users/$id/status",
        body: {"status": status},
        parse: (data) => AppUser.fromJson(asJsonMap(data)),
      );

  Future<Paginated<AuditLog>> auditLogs({String? entityType, int page = 1, int limit = 20}) => _client.getPaginated(
        "/admin/audit-logs",
        query: {"entityType": entityType, "page": page, "limit": limit},
        parseItem: AuditLog.fromJson,
      );

  Future<Paginated<DrivingLicense>> drivingLicenses({String? status, int page = 1, int limit = 20}) =>
      _client.getPaginated(
        "/admin/driving-licenses",
        query: {"status": status, "page": page, "limit": limit},
        parseItem: DrivingLicense.fromJson,
      );

  Future<DrivingLicense> reviewDrivingLicense(String id, {required String status, String? rejectionReason}) =>
      _client.patch(
        "/admin/driving-licenses/$id/review",
        body: {"status": status, "rejectionReason": ?rejectionReason},
        parse: (data) => DrivingLicense.fromJson(asJsonMap(data)),
      );

  Future<Map<String, dynamic>> getSetting(String key) =>
      _client.get("/admin/settings/$key", parse: (data) => asJsonMap(data));

  Future<Map<String, dynamic>> upsertSetting(String key, Object? value) =>
      _client.put("/admin/settings/$key", body: {"value": value}, parse: (data) => asJsonMap(data));

  // ─── Monetization ───

  Future<List<MonetizationFeature>> monetizationFeatures() => _client.get(
        "/admin/monetization/features",
        parse: (data) => (data as List).map((e) => MonetizationFeature.fromJson(asJsonMap(e))).toList(),
      );

  /// Both fields are optional server-side — pass only what's changing so a
  /// toggle doesn't clobber the feature's config blob and vice versa.
  Future<MonetizationFeature> updateMonetizationFeature(
    String key, {
    bool? isEnabled,
    Map<String, dynamic>? config,
  }) =>
      _client.patch(
        "/admin/monetization/features/$key",
        body: {"isEnabled": ?isEnabled, "config": ?config},
        parse: (data) => MonetizationFeature.fromJson(asJsonMap(data)),
      );

  /// Every slot including inactive ones — the public `/catalog/ad-slots` feed
  /// only returns active rows.
  Future<List<AdSlot>> manageAdSlots() => _client.get(
        "/admin/ad-slots/manage",
        parse: (data) => (data as List).map((e) => AdSlot.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<AffiliatePartner>> manageAffiliatePartners() => _client.get(
        "/admin/affiliate-partners/manage",
        parse: (data) => (data as List).map((e) => AffiliatePartner.fromJson(asJsonMap(e))).toList(),
      );

  // ─── CMS ───

  Future<CmsPage> upsertCmsPage({required String slug, required String title, required String content}) =>
      _client.put(
        "/admin/cms",
        body: {"slug": slug, "title": title, "content": content},
        parse: (data) => CmsPage.fromJson(asJsonMap(data)),
      );

  Future<BlogPost> upsertBlogPost({
    required String slug,
    required String title,
    required String content,
    String? excerpt,
    String? coverImageUrl,
    required String status,
  }) =>
      _client.put(
        "/admin/blog",
        body: {
          "slug": slug,
          "title": title,
          "content": content,
          "excerpt": ?excerpt,
          "coverImageUrl": ?coverImageUrl,
          "status": status,
        },
        parse: (data) => BlogPost.fromJson(asJsonMap(data)),
      );

  /// Every post including drafts — the public `catalog.blogPosts()` feed only
  /// returns PUBLISHED rows, which would hide a draft as soon as it's saved.
  Future<Paginated<BlogPost>> manageBlogPosts({int page = 1, int limit = 50}) => _client.getPaginated(
        "/admin/blog/manage",
        query: {"page": page, "limit": limit},
        parseItem: BlogPost.fromJson,
      );

  /// Every slide including inactive ones.
  Future<List<HeroBannerSlide>> manageHeroBanners() => _client.get(
        "/admin/hero-banners/manage",
        parse: (data) => (data as List).map((e) => HeroBannerSlide.fromJson(asJsonMap(e))).toList(),
      );
}
