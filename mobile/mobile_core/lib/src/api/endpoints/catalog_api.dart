import '../../models/catalog.dart';
import '../../models/monetization.dart';
import '../../models/pagination.dart';
import '../api_client.dart';

class CatalogApi {
  final ApiClient _client;
  CatalogApi(this._client);

  Future<List<Country>> countries() => _client.get(
        "/catalog/countries",
        parse: (data) => (data as List).map((e) => Country.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<City>> cities({String? countryId, bool? popular}) => _client.get(
        "/catalog/cities",
        query: {"countryId": countryId, "popular": popular},
        parse: (data) => (data as List).map((e) => City.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<VehicleCategory>> vehicleCategories() => _client.get(
        "/catalog/vehicle-categories",
        parse: (data) => (data as List).map((e) => VehicleCategory.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<VehicleBrand>> vehicleBrands() => _client.get(
        "/catalog/vehicle-brands",
        parse: (data) => (data as List).map((e) => VehicleBrand.fromJson(asJsonMap(e))).toList(),
      );

  Future<CmsPage> cmsPage(String slug) =>
      _client.get("/admin/cms/$slug", parse: (data) => CmsPage.fromJson(asJsonMap(data)));

  /// Published posts only — the backend filters by `status = PUBLISHED` and
  /// orders newest-first (backend/app/modules/admin/router.py::list_blog_posts).
  Future<Paginated<BlogPost>> blogPosts({int page = 1, int limit = 10}) => _client.getPaginated(
        "/admin/blog",
        query: {"page": page, "limit": limit},
        parseItem: BlogPost.fromJson,
      );

  Future<BlogPost> blogPost(String slug) =>
      _client.get("/admin/blog/$slug", parse: (data) => BlogPost.fromJson(asJsonMap(data)));

  Future<List<HeroBannerSlide>> heroBanners() => _client.get(
        "/admin/hero-banners",
        parse: (data) => (data as List).map((e) => HeroBannerSlide.fromJson(asJsonMap(e))).toList(),
      );

  /// Returns `[]` when the Sponsored placements toggle is off — gating happens
  /// server-side, so an empty list simply means "render nothing".
  Future<List<AdSlot>> adSlots() => _client.get(
        "/catalog/ad-slots",
        parse: (data) => (data as List).map((e) => AdSlot.fromJson(asJsonMap(e))).toList(),
      );

  /// Returns `[]` when the Affiliate program toggle is off.
  Future<List<AffiliatePartner>> affiliatePartners() => _client.get(
        "/catalog/affiliate-partners",
        parse: (data) => (data as List).map((e) => AffiliatePartner.fromJson(asJsonMap(e))).toList(),
      );

  // ─── Admin CRUD ───
  //
  // The reads above are public; these four resources are admin-only writes
  // (backend/app/modules/catalog/router.py). Each takes the same field set its
  // create/update schema declares, so callers pass a plain payload map.

  Future<City> createCity(Map<String, dynamic> payload) =>
      _client.post("/catalog/cities", body: payload, parse: (data) => City.fromJson(asJsonMap(data)));

  Future<City> updateCity(String id, Map<String, dynamic> payload) =>
      _client.patch("/catalog/cities/$id", body: payload, parse: (data) => City.fromJson(asJsonMap(data)));

  Future<void> deleteCity(String id) => _client.delete("/catalog/cities/$id", parse: asVoid);

  Future<VehicleCategory> createVehicleCategory(Map<String, dynamic> payload) => _client.post(
        "/catalog/vehicle-categories",
        body: payload,
        parse: (data) => VehicleCategory.fromJson(asJsonMap(data)),
      );

  Future<VehicleCategory> updateVehicleCategory(String id, Map<String, dynamic> payload) => _client.patch(
        "/catalog/vehicle-categories/$id",
        body: payload,
        parse: (data) => VehicleCategory.fromJson(asJsonMap(data)),
      );

  Future<void> deleteVehicleCategory(String id) => _client.delete("/catalog/vehicle-categories/$id", parse: asVoid);

  Future<VehicleBrand> createVehicleBrand(Map<String, dynamic> payload) => _client.post(
        "/catalog/vehicle-brands",
        body: payload,
        parse: (data) => VehicleBrand.fromJson(asJsonMap(data)),
      );

  Future<VehicleBrand> updateVehicleBrand(String id, Map<String, dynamic> payload) => _client.patch(
        "/catalog/vehicle-brands/$id",
        body: payload,
        parse: (data) => VehicleBrand.fromJson(asJsonMap(data)),
      );

  Future<void> deleteVehicleBrand(String id) => _client.delete("/catalog/vehicle-brands/$id", parse: asVoid);

  Future<Country> createCountry(Map<String, dynamic> payload) =>
      _client.post("/catalog/countries", body: payload, parse: (data) => Country.fromJson(asJsonMap(data)));

  Future<Country> updateCountry(String id, Map<String, dynamic> payload) =>
      _client.patch("/catalog/countries/$id", body: payload, parse: (data) => Country.fromJson(asJsonMap(data)));

  Future<void> deleteCountry(String id) => _client.delete("/catalog/countries/$id", parse: asVoid);
}
