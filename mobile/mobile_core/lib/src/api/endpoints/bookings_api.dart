import '../../models/booking.dart';
import '../../models/pagination.dart';
import '../api_client.dart';

class BookingsApi {
  final ApiClient _client;
  BookingsApi(this._client);

  Future<Booking> create({
    required String vehicleId,
    required String drivingLicenseId,
    required DateTime pickupDatetime,
    required DateTime returnDatetime,
    required String pickupLocation,
    required String returnLocation,
    double? pickupLatitude,
    double? pickupLongitude,
    double? returnLatitude,
    double? returnLongitude,
    String? couponCode,
  }) {
    return _client.post(
      "/bookings",
      body: {
        "vehicleId": vehicleId,
        "drivingLicenseId": drivingLicenseId,
        "pickupDatetime": pickupDatetime.toUtc().toIso8601String(),
        "returnDatetime": returnDatetime.toUtc().toIso8601String(),
        "pickupLocation": pickupLocation,
        "returnLocation": returnLocation,
        "pickupLatitude": ?pickupLatitude,
        "pickupLongitude": ?pickupLongitude,
        "returnLatitude": ?returnLatitude,
        "returnLongitude": ?returnLongitude,
        "couponCode": ?couponCode,
      },
      parse: (data) => Booking.fromJson(asJsonMap(data)),
    );
  }

  Future<Paginated<Booking>> mine({String? status, int page = 1, int limit = 20}) => _client.getPaginated(
        "/bookings/mine",
        query: {"status": status, "page": page, "limit": limit},
        parseItem: Booking.fromJson,
      );

  Future<Booking> cancel(String id, {String? reason}) => _client.post(
        "/bookings/$id/cancel",
        body: {"reason": ?reason},
        parse: (data) => Booking.fromJson(asJsonMap(data)),
      );

  Future<Paginated<Booking>> partnerMine({String? status, int page = 1, int limit = 20}) => _client.getPaginated(
        "/bookings/partner/mine",
        query: {"status": status, "page": page, "limit": limit},
        parseItem: Booking.fromJson,
      );

  Future<Booking> updateStatus(String id, {required String status, String? note}) => _client.patch(
        "/bookings/$id/status",
        body: {"status": status, "note": ?note},
        parse: (data) => Booking.fromJson(asJsonMap(data)),
      );

  Future<Booking> byId(String id) => _client.get("/bookings/$id", parse: (data) => Booking.fromJson(asJsonMap(data)));
}
