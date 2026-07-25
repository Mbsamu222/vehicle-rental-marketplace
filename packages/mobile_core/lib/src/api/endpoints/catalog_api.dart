import '../../models/catalog.dart';
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

  Future<List<HeroBannerSlide>> heroBanners() => _client.get(
        "/admin/hero-banners",
        parse: (data) => (data as List).map((e) => HeroBannerSlide.fromJson(asJsonMap(e))).toList(),
      );
}
