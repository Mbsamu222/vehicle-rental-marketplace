import '../../models/review.dart';
import '../api_client.dart';

class ReviewsApi {
  final ApiClient _client;
  ReviewsApi(this._client);

  Future<List<Review>> forVehicle(String vehicleId) => _client.get(
        "/reviews/vehicle/$vehicleId",
        parse: (data) => (data as List).map((e) => Review.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<Review>> forPartner(String rentalPartnerId) => _client.get(
        "/reviews/partner/$rentalPartnerId",
        parse: (data) => (data as List).map((e) => Review.fromJson(asJsonMap(e))).toList(),
      );

  Future<Review> create({
    required String bookingId,
    required int vehicleRating,
    required int partnerRating,
    String? comment,
    List<String>? imageUrls,
  }) =>
      _client.post(
        "/reviews",
        body: {
          "bookingId": bookingId,
          "vehicleRating": vehicleRating,
          "partnerRating": partnerRating,
          "comment": ?comment,
          "imageUrls": ?imageUrls,
        },
        parse: (data) => Review.fromJson(asJsonMap(data)),
      );

  Future<ReviewReply> reply(String reviewId, String message) => _client.post(
        "/reviews/$reviewId/reply",
        body: {"message": message},
        parse: (data) => ReviewReply.fromJson(asJsonMap(data)),
      );

  Future<void> report(String reviewId, String reason) =>
      _client.post("/reviews/$reviewId/report", body: {"reason": reason}, parse: asVoid);
}
