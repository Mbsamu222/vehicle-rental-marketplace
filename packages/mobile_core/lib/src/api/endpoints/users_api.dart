import '../../models/admin.dart';
import '../../models/user.dart';
import '../../models/vehicle.dart';
import '../api_client.dart';

class WishlistEntry {
  final String vehicleId;
  final Vehicle vehicle;
  WishlistEntry({required this.vehicleId, required this.vehicle});

  factory WishlistEntry.fromJson(Map<String, dynamic> json) => WishlistEntry(
        vehicleId: json["vehicleId"] as String? ?? "",
        vehicle: Vehicle.fromJson(Map<String, dynamic>.from(json["vehicle"] as Map)),
      );
}

class UsersApi {
  final ApiClient _client;
  UsersApi(this._client);

  Future<AppUser> updateProfile(Map<String, dynamic> payload) =>
      _client.patch("/users/me", body: payload, parse: (data) => AppUser.fromJson(asJsonMap(data)));

  Future<CustomerDashboardStats> dashboard() =>
      _client.get("/users/me/dashboard", parse: (data) => CustomerDashboardStats.fromJson(asJsonMap(data)));

  Future<List<DrivingLicense>> drivingLicenses() => _client.get(
        "/users/me/driving-licenses",
        parse: (data) => (data as List).map((e) => DrivingLicense.fromJson(asJsonMap(e))).toList(),
      );

  Future<DrivingLicense> addDrivingLicense({
    required String licenseNumber,
    required String frontImageUrl,
    String? backImageUrl,
    required DateTime expiryDate,
  }) =>
      _client.post(
        "/users/me/driving-licenses",
        body: {
          "licenseNumber": licenseNumber,
          "frontImageUrl": frontImageUrl,
          "backImageUrl": ?backImageUrl,
          "expiryDate": "${expiryDate.year.toString().padLeft(4, '0')}-${expiryDate.month.toString().padLeft(2, '0')}-${expiryDate.day.toString().padLeft(2, '0')}",
        },
        parse: (data) => DrivingLicense.fromJson(asJsonMap(data)),
      );

  Future<List<WishlistEntry>> wishlist() => _client.get(
        "/users/me/wishlist",
        parse: (data) => (data as List).map((e) => WishlistEntry.fromJson(asJsonMap(e))).toList(),
      );

  Future<void> addToWishlist(String vehicleId) =>
      _client.post("/users/me/wishlist/$vehicleId", parse: asVoid);

  Future<void> removeFromWishlist(String vehicleId) =>
      _client.delete("/users/me/wishlist/$vehicleId", parse: asVoid);

  Future<List<SavedLocation>> savedLocations() => _client.get(
        "/users/me/saved-locations",
        parse: (data) => (data as List).map((e) => SavedLocation.fromJson(asJsonMap(e))).toList(),
      );

  Future<SavedLocation> addSavedLocation({
    required String cityId,
    required String label,
    required String address,
    double? latitude,
    double? longitude,
  }) =>
      _client.post(
        "/users/me/saved-locations",
        body: {
          "cityId": cityId,
          "label": label,
          "address": address,
          "latitude": ?latitude,
          "longitude": ?longitude,
        },
        parse: (data) => SavedLocation.fromJson(asJsonMap(data)),
      );

  Future<void> deleteSavedLocation(String id) => _client.delete("/users/me/saved-locations/$id", parse: asVoid);
}
