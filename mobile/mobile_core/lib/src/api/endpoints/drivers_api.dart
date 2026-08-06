import '../../models/driver.dart';
import '../api_client.dart';

class DriversApi {
  final ApiClient _client;
  DriversApi(this._client);

  /// Verified drivers with no clashing assignment for the whole window. Each
  /// carries `quotedAmount` — the price for these exact dates.
  Future<List<Driver>> available({
    required String cityId,
    required DateTime pickup,
    required DateTime returnAt,
  }) =>
      _client.get(
        "/drivers/available",
        query: {
          "cityId": cityId,
          "pickup": pickup.toUtc().toIso8601String(),
          "returnAt": returnAt.toUtc().toIso8601String(),
        },
        parse: (data) => (data as List).map((e) => Driver.fromJson(asJsonMap(e))).toList(),
      );

  Future<DriverAssignment> hire(String bookingId, String driverId) => _client.post(
        "/drivers/bookings/$bookingId/request",
        body: {"driverId": driverId},
        parse: (data) => DriverAssignment.fromJson(asJsonMap(data)),
      );

  // ─── Driver's own surface ───

  Future<Driver> myProfile() => _client.get("/drivers/me", parse: (data) => Driver.fromJson(asJsonMap(data)));

  Future<Driver> createProfile(Map<String, dynamic> payload) =>
      _client.post("/drivers/me", body: payload, parse: (data) => Driver.fromJson(asJsonMap(data)));

  Future<Driver> updateProfile(Map<String, dynamic> payload) =>
      _client.patch("/drivers/me", body: payload, parse: (data) => Driver.fromJson(asJsonMap(data)));

  Future<Map<String, dynamic>> myStats() => _client.get("/drivers/me/stats", parse: asJsonMap);

  Future<List<DriverAssignment>> myAssignments() => _client.get(
        "/drivers/me/assignments",
        parse: (data) => (data as List).map((e) => DriverAssignment.fromJson(asJsonMap(e))).toList(),
      );

  Future<DriverAssignment> respond(String id, {required bool accept, String? declineReason}) => _client.patch(
        "/drivers/me/assignments/$id",
        body: {"accept": accept, "declineReason": ?declineReason},
        parse: (data) => DriverAssignment.fromJson(asJsonMap(data)),
      );
}
