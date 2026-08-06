import '../../models/pagination.dart';
import '../../models/payment.dart';
import '../../models/rental_partner.dart';
import '../../models/subscription.dart';
import '../api_client.dart';

class RentalPartnersApi {
  final ApiClient _client;
  RentalPartnersApi(this._client);

  Future<RentalPartner> createProfile(Map<String, dynamic> payload) => _client.post(
        "/rental-partners/me",
        body: payload,
        parse: (data) => RentalPartner.fromJson(asJsonMap(data)),
      );

  Future<RentalPartner> myProfile() =>
      _client.get("/rental-partners/me", parse: (data) => RentalPartner.fromJson(asJsonMap(data)));

  Future<RentalPartner> updateProfile(Map<String, dynamic> payload) => _client.patch(
        "/rental-partners/me",
        body: payload,
        parse: (data) => RentalPartner.fromJson(asJsonMap(data)),
      );

  Future<PartnerDashboardStats> dashboard() => _client.get(
        "/rental-partners/me/dashboard",
        parse: (data) => PartnerDashboardStats.fromJson(asJsonMap(data)),
      );

  Future<BusinessDocument> uploadDocument({required String type, required String fileUrl}) => _client.post(
        "/rental-partners/me/documents",
        body: {"type": type, "fileUrl": fileUrl},
        parse: (data) => BusinessDocument.fromJson(asJsonMap(data)),
      );

  Future<BankDetail> setBankDetails(Map<String, dynamic> payload) => _client.put(
        "/rental-partners/me/bank-details",
        body: payload,
        parse: (data) => BankDetail.fromJson(asJsonMap(data)),
      );

  /// Throws [ApiException] with 403 when fleet analytics is disabled
  /// platform-wide or the partner's plan doesn't include it — callers should
  /// render a "locked / upgrade" state for that case rather than a generic
  /// error.
  Future<PartnerAnalytics> analytics() => _client.get(
        "/rental-partners/me/analytics",
        parse: (data) => PartnerAnalytics.fromJson(asJsonMap(data)),
      );

  /// Payout settlements for the signed-in partner, newest first.
  Future<Paginated<AdminTransaction>> myPayouts({int page = 1, int limit = 20}) => _client.getPaginated(
        "/payouts/mine",
        query: {"page": page, "limit": limit},
        parseItem: AdminTransaction.fromJson,
      );

  // ─── Admin oversight ───

  Future<Paginated<RentalPartner>> list({String? status, int page = 1, int limit = 20}) => _client.getPaginated(
        "/rental-partners",
        query: {"status": status, "page": page, "limit": limit},
        parseItem: RentalPartner.fromJson,
      );

  Future<RentalPartner> byId(String id) =>
      _client.get("/rental-partners/$id", parse: (data) => RentalPartner.fromJson(asJsonMap(data)));

  Future<RentalPartner> updateVerificationStatus(String id, String status) => _client.patch(
        "/rental-partners/$id/verification-status",
        body: {"status": status},
        parse: (data) => RentalPartner.fromJson(asJsonMap(data)),
      );

  Future<BusinessDocument> reviewDocument(String documentId, {required String status, String? rejectionReason}) =>
      _client.patch(
        "/rental-partners/documents/$documentId/review",
        body: {"status": status, "rejectionReason": ?rejectionReason},
        parse: (data) => BusinessDocument.fromJson(asJsonMap(data)),
      );
}
