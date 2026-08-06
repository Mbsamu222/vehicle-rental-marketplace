import '../../models/subscription.dart';
import '../api_client.dart';

class SubscriptionsApi {
  final ApiClient _client;
  SubscriptionsApi(this._client);

  /// Active plans, cheapest first — public, so the plan grid renders even
  /// before a partner has a subscription.
  Future<List<SubscriptionPlan>> plans() => _client.get(
        "/subscriptions/plans",
        parse: (data) => (data as List).map((e) => SubscriptionPlan.fromJson(asJsonMap(e))).toList(),
      );

  /// The partner's latest subscription, or null when they've never requested
  /// one (the endpoint returns a null payload rather than 404).
  Future<PartnerSubscription?> mine() => _client.get(
        "/subscriptions/mine",
        parse: (data) => data == null ? null : PartnerSubscription.fromJson(asJsonMap(data)),
      );

  /// Requests a plan. Activation is an admin action, so the new subscription
  /// comes back PENDING.
  Future<PartnerSubscription> request(String planId) => _client.post(
        "/subscriptions/mine",
        body: {"planId": planId},
        parse: (data) => PartnerSubscription.fromJson(asJsonMap(data)),
      );

  // ─── Admin oversight ───

  Future<List<SubscriptionPlan>> managePlans() => _client.get(
        "/subscriptions/plans/manage",
        parse: (data) => (data as List).map((e) => SubscriptionPlan.fromJson(asJsonMap(e))).toList(),
      );

  Future<List<PartnerSubscription>> pending() => _client.get(
        "/subscriptions/pending",
        parse: (data) => (data as List).map((e) => PartnerSubscription.fromJson(asJsonMap(e))).toList(),
      );
}
