import '../../models/pagination.dart';
import '../../models/vehicle.dart';
import '../api_client.dart';

class VehicleSearchFilters {
  final String? cityId;
  final String? categoryId;
  final String? brandId;
  final String? transmission;
  final String? fuelType;
  final double? minPrice;
  final double? maxPrice;
  final int? seatingCapacity;
  final DateTime? pickupDatetime;
  final DateTime? returnDatetime;
  final String? sortBy;

  const VehicleSearchFilters({
    this.cityId,
    this.categoryId,
    this.brandId,
    this.transmission,
    this.fuelType,
    this.minPrice,
    this.maxPrice,
    this.seatingCapacity,
    this.pickupDatetime,
    this.returnDatetime,
    this.sortBy,
  });

  Map<String, dynamic> toQuery() => {
        "cityId": cityId,
        "categoryId": categoryId,
        "brandId": brandId,
        "transmission": transmission,
        "fuelType": fuelType,
        "minPrice": minPrice,
        "maxPrice": maxPrice,
        "seatingCapacity": seatingCapacity,
        "pickupDatetime": pickupDatetime?.toUtc().toIso8601String(),
        "returnDatetime": returnDatetime?.toUtc().toIso8601String(),
        "sortBy": sortBy,
      };
}

class VehiclesApi {
  final ApiClient _client;
  VehiclesApi(this._client);

  Future<Paginated<Vehicle>> search(VehicleSearchFilters filters, {int page = 1, int limit = 20}) {
    return _client.getPaginated(
      "/vehicles/search",
      query: {...filters.toQuery(), "page": page, "limit": limit},
      parseItem: Vehicle.fromJson,
    );
  }

  Future<Vehicle> byId(String id) => _client.get("/vehicles/$id", parse: (data) => Vehicle.fromJson(asJsonMap(data)));

  Future<bool> checkAvailability(String id, DateTime pickup, DateTime ret) => _client.get(
        "/vehicles/$id/availability",
        query: {
          "pickupDatetime": pickup.toUtc().toIso8601String(),
          "returnDatetime": ret.toUtc().toIso8601String(),
        },
        parse: (data) => asJsonMap(data)["available"] == true,
      );

  // ─── Partner self-service ───

  Future<Paginated<Vehicle>> myVehicles({int page = 1, int limit = 20}) => _client.getPaginated(
        "/vehicles/partner/mine",
        query: {"page": page, "limit": limit},
        parseItem: Vehicle.fromJson,
      );

  Future<Vehicle> create(Map<String, dynamic> payload) =>
      _client.post("/vehicles", body: payload, parse: (data) => Vehicle.fromJson(asJsonMap(data)));

  Future<Vehicle> update(String id, Map<String, dynamic> payload) =>
      _client.patch("/vehicles/$id", body: payload, parse: (data) => Vehicle.fromJson(asJsonMap(data)));

  Future<void> deactivate(String id) => _client.delete("/vehicles/$id", parse: asVoid);

  Future<List<VehicleImage>> addImages(String id, List<Map<String, dynamic>> images) => _client.post(
        "/vehicles/$id/images",
        body: {"images": images},
        parse: (data) => (data as List).map((e) => VehicleImage.fromJson(asJsonMap(e))).toList(),
      );

  Future<void> deleteImage(String vehicleId, String imageId) =>
      _client.delete("/vehicles/$vehicleId/images/$imageId", parse: asVoid);

  Future<VehicleAvailabilityBlock> blockAvailability(String id, DateTime start, DateTime end, {String? reason}) =>
      _client.post(
        "/vehicles/$id/availability-block",
        body: {
          "startDate": start.toUtc().toIso8601String(),
          "endDate": end.toUtc().toIso8601String(),
          "reason": ?reason,
        },
        parse: (data) => VehicleAvailabilityBlock.fromJson(asJsonMap(data)),
      );

  // ─── Admin ───

  Future<Paginated<Vehicle>> pendingApproval({int page = 1, int limit = 20}) => _client.getPaginated(
        "/vehicles/admin/pending-approval",
        query: {"page": page, "limit": limit},
        parseItem: Vehicle.fromJson,
      );

  Future<Vehicle> review(String id, {required String status, String? rejectionReason}) => _client.patch(
        "/vehicles/$id/review",
        body: {"status": status, "rejectionReason": ?rejectionReason},
        parse: (data) => Vehicle.fromJson(asJsonMap(data)),
      );
}
