import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/partner-web/src/screens/subscription/SubscriptionPage.tsx —
/// current-plan summary plus the plan cards, with the same feature bullets
/// derived from each plan's `features` map.
final _plansProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).subscriptions.plans());
final _mySubscriptionProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).subscriptions.mine());

class SubscriptionPage extends ConsumerWidget {
  const SubscriptionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(_plansProvider);
    final subscription = ref.watch(_mySubscriptionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Subscription")),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_plansProvider);
          ref.invalidate(_mySubscriptionProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PageHeader(
              title: "Subscription",
              subtitle: "Higher tiers unlock more vehicle listings, a lower commission rate, and fleet analytics.",
            ),
            const SizedBox(height: 18),
            if (subscription.valueOrNull != null) ...[
              _CurrentPlanCard(subscription: subscription.value!),
              const SizedBox(height: 18),
            ],
            plans.when(
              data: (list) => list.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.only(top: 24),
                      child: EmptyState(icon: Icons.auto_awesome_outlined, title: "No subscription plans available yet"),
                    )
                  : Column(
                      children: [
                        for (final plan in list) ...[
                          _PlanCard(
                            plan: plan,
                            subscription: subscription.valueOrNull,
                            onRequest: () async {
                              try {
                                await ref.read(marketplaceApiProvider).subscriptions.request(plan.id);
                                ref.invalidate(_mySubscriptionProvider);
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      "Requested the ${plan.name} plan — our team will confirm your payment and activate it shortly.",
                                    ),
                                  ),
                                );
                              } on ApiException catch (e) {
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(SnackBar(content: Text("Could not request plan: ${e.message}")));
                              }
                            },
                          ),
                          const SizedBox(height: 12),
                        ],
                      ],
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_plansProvider)),
            ),
          ],
        ),
      ),
    );
  }
}

class _CurrentPlanCard extends StatelessWidget {
  final PartnerSubscription subscription;
  const _CurrentPlanCard({required this.subscription});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "CURRENT PLAN",
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.7,
                    color: AppColors.mutedTextOf(context),
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  subscription.plan?.name ?? "—",
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                ),
                if (subscription.status == SubscriptionStatus.active && subscription.expiresAt != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    "Renews / expires ${formatDate(subscription.expiresAt!)}",
                    style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                  ),
                ],
                if (subscription.status == SubscriptionStatus.pending) ...[
                  const SizedBox(height: 6),
                  const Row(
                    children: [
                      Icon(Icons.schedule, size: 13, color: AppColors.warning),
                      SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          "Awaiting payment confirmation from our team",
                          style: TextStyle(fontSize: 11.5, color: AppColors.warning),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          StatusBadge.subscription(subscription.status),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final PartnerSubscription? subscription;
  final Future<void> Function() onRequest;

  const _PlanCard({required this.plan, required this.subscription, required this.onRequest});

  /// A new plan can only be requested when there's no live subscription — same
  /// rule the web page enforces.
  bool get _canRequest =>
      subscription == null ||
      subscription!.status == SubscriptionStatus.expired ||
      subscription!.status == SubscriptionStatus.cancelled;

  bool get _isCurrent =>
      subscription?.plan?.id == plan.id &&
      (subscription!.status == SubscriptionStatus.active || subscription!.status == SubscriptionStatus.pending);

  /// Mirrors the web card's bullet list: vehicle cap first, then the optional
  /// feature flags in the same order.
  List<String> get _bullets {
    final features = plan.features;
    return [
      plan.maxVehicles != null ? "Up to ${plan.maxVehicles} vehicles" : "Unlimited vehicles",
      if (features["commissionOverride"] != null) "${features["commissionOverride"]}% commission rate",
      if (features["analytics"] == true) "Fleet analytics dashboard",
      if (features["listingBoost"] == true) "Priority listing boost",
      if (features["support"] is String) "${features["support"]} support",
    ];
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final priceColor = isDark ? AppColors.accentTextDark : AppColors.secondary;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: _isCurrent ? Border.all(color: AppColors.secondary, width: 1.5) : null,
      ),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(plan.name, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textOf(context))),
            if (plan.description != null) ...[
              const SizedBox(height: 4),
              Text(plan.description!, style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
            ],
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  formatCurrency(plan.price, precise: true),
                  style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900, color: priceColor),
                ),
                const SizedBox(width: 5),
                Text(
                  "/ ${plan.durationDays} days",
                  style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            for (final bullet in _bullets)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.check, size: 15, color: priceColor),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        bullet,
                        style: TextStyle(fontSize: 13, color: AppColors.textOf(context)),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            if (_isCurrent)
              StatusBadge(
                label: subscription!.status == SubscriptionStatus.pending ? "Requested" : "Current plan",
                tone: subscription!.status == SubscriptionStatus.pending ? BadgeTone.warning : BadgeTone.success,
              )
            else
              LoadingButton(
                label: _canRequest ? "Request this plan" : "Complete or cancel your current plan first",
                outlined: true,
                onPressed: _canRequest ? onRequest : null,
              ),
          ],
        ),
      ),
    );
  }
}
