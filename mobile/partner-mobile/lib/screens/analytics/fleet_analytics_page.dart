import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/partner-web/src/screens/analytics/FleetAnalyticsPage.tsx.
///
/// The endpoint 403s when fleet analytics is switched off platform-wide or the
/// partner's plan doesn't include it. Like the web page, that is rendered as a
/// "locked — check your plan" state, not as a failure.
final _analyticsProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).rentalPartners.analytics());

class FleetAnalyticsPage extends ConsumerWidget {
  const FleetAnalyticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analytics = ref.watch(_analyticsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Fleet analytics")),
      body: analytics.when(
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(_analyticsProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const PageHeader(
                title: "Fleet analytics",
                subtitle: "Utilization and demand insights across your active fleet, last 30 days.",
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: StatCard(
                      label: "Active vehicles",
                      value: "${data.vehicleCount}",
                      icon: Icons.directions_car_filled_outlined,
                      tone: StatCardTone.primary,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: StatCard(
                      label: "Utilization (30d)",
                      value: "${data.utilizationPercent}%",
                      icon: Icons.speed,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              StatCard(
                label: "Avg. revenue / vehicle",
                value: formatCurrency(data.averageRevenuePerVehicle, precise: true),
                icon: Icons.currency_rupee,
                tone: StatCardTone.success,
              ),
              const SizedBox(height: 20),
              _ChartCard(
                title: "Top vehicles by revenue",
                emptyMessage: "No completed bookings yet.",
                bars: [
                  for (final v in data.topVehicles)
                    StatBar(
                      label: v.model,
                      value: v.totalRevenue,
                      maxValue: data.topVehicles.map((e) => e.totalRevenue).fold(1.0, (a, b) => a > b ? a : b),
                      valueLabel: formatCurrency(v.totalRevenue, precise: true),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              _ChartCard(
                title: "Demand by category (30d)",
                emptyMessage: "No bookings in the last 30 days.",
                bars: [
                  for (final c in data.categoryDemand)
                    StatBar(
                      label: c.categoryName,
                      value: c.bookingCount.toDouble(),
                      maxValue: data.categoryDemand
                          .map((e) => e.bookingCount.toDouble())
                          .fold(1.0, (a, b) => a > b ? a : b),
                      valueLabel: "${c.bookingCount} booking${c.bookingCount == 1 ? "" : "s"}",
                    ),
                ],
              ),
            ],
          ),
        ),
        loading: () => const SectionLoading(),
        error: (error, _) {
          final locked = error is ApiException && error.statusCode == 403;
          if (!locked) {
            return ErrorView(message: "$error", onRetry: () => ref.invalidate(_analyticsProvider));
          }
          return Padding(
            padding: const EdgeInsets.all(24),
            child: EmptyState(
              icon: Icons.lock_outline,
              title: "Fleet analytics isn't available on your plan yet",
              message:
                  "This is a paid add-on unlocked by certain subscription tiers. Check the Subscription page to see which plans include it, or contact us to enable it.",
              action: ElevatedButton(
                onPressed: () => context.push("/subscription"),
                child: const Text("View plans"),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  final String title;
  final String emptyMessage;
  final List<Widget> bars;
  const _ChartCard({required this.title, required this.emptyMessage, required this.bars});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context))),
          const SizedBox(height: 16),
          if (bars.isEmpty)
            Text(emptyMessage, style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context)))
          else
            for (var i = 0; i < bars.length; i++) ...[
              bars[i],
              if (i != bars.length - 1) const SizedBox(height: 16),
            ],
        ],
      ),
    );
  }
}
