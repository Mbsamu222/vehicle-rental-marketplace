import '../../models/pagination.dart';
import '../../models/payment.dart';
import '../api_client.dart';

class PaymentOrderResult {
  final Payment payment;
  final Map<String, dynamic> providerConfig;
  PaymentOrderResult({required this.payment, required this.providerConfig});
}

class PaymentsApi {
  final ApiClient _client;
  PaymentsApi(this._client);

  Future<PaymentOrderResult> createOrder({required String bookingId, required String provider}) => _client.post(
        "/payments/orders",
        body: {"bookingId": bookingId, "provider": provider},
        parse: (data) {
          final json = asJsonMap(data);
          return PaymentOrderResult(
            payment: Payment.fromJson(Map<String, dynamic>.from(json["payment"] as Map)),
            providerConfig: Map<String, dynamic>.from((json["providerConfig"] as Map?) ?? const {}),
          );
        },
      );

  Future<Payment> verify({required String paymentId, required String providerRefId, String? providerSignature}) =>
      _client.post(
        "/payments/verify",
        body: {
          "paymentId": paymentId,
          "providerRefId": providerRefId,
          "providerSignature": ?providerSignature,
        },
        parse: (data) => Payment.fromJson(asJsonMap(data)),
      );

  Future<Paginated<Payment>> mine({int page = 1, int limit = 20}) => _client.getPaginated(
        "/payments/mine",
        query: {"page": page, "limit": limit},
        parseItem: Payment.fromJson,
      );

  Future<Wallet> wallet() => _client.get("/payments/wallet", parse: (data) => Wallet.fromJson(asJsonMap(data)));

  Future<Paginated<AdminTransaction>> transactions({
    String? type,
    String? rentalPartnerId,
    String? customerId,
    int page = 1,
    int limit = 20,
  }) =>
      _client.getPaginated(
        "/payments/transactions",
        query: {
          "type": type,
          "rentalPartnerId": rentalPartnerId,
          "customerId": customerId,
          "page": page,
          "limit": limit,
        },
        parseItem: AdminTransaction.fromJson,
      );

  Future<Payment> refund(String id, {double? amount, String? reason}) => _client.post(
        "/payments/$id/refund",
        body: {"amount": ?amount, "reason": ?reason},
        parse: (data) => Payment.fromJson(asJsonMap(data)),
      );
}
