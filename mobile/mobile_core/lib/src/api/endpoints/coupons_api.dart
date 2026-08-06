import '../../models/coupon.dart';
import '../../models/pagination.dart';
import '../api_client.dart';

class CouponsApi {
  final ApiClient _client;
  CouponsApi(this._client);

  Future<CouponValidationResult> validate(String code, double bookingAmount) => _client.post(
        "/coupons/validate",
        body: {"code": code, "bookingAmount": bookingAmount},
        parse: (data) => CouponValidationResult.fromJson(asJsonMap(data)),
      );

  Future<Paginated<Coupon>> list({int page = 1, int limit = 20}) => _client.getPaginated(
        "/coupons",
        query: {"page": page, "limit": limit},
        parseItem: Coupon.fromJson,
      );

  Future<Coupon> create(Map<String, dynamic> payload) =>
      _client.post("/coupons", body: payload, parse: (data) => Coupon.fromJson(asJsonMap(data)));

  Future<Coupon> update(String id, Map<String, dynamic> payload) =>
      _client.patch("/coupons/$id", body: payload, parse: (data) => Coupon.fromJson(asJsonMap(data)));

  Future<void> delete(String id) => _client.delete("/coupons/$id", parse: asVoid);
}
