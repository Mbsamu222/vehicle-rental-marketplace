import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import '../../providers/partner_profile_provider.dart';

final _dashboardProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).rentalPartners.dashboard());
final _recentBookingsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).bookings.partnerMine(limit: 5));

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(partnerProfileProvider);
    final statsAsync = ref.watch(_dashboardProvider);
    final recentBookingsAsync = ref.watch(_recentBookingsProvider);
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: DashboardTopBar(
        title: "Partner Hub",
        userName: user?.fullName,
        onToggleTheme: () => ref.read(themeModeProvider.notifier).toggleTheme(),
        extraActions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: "Add Vehicle",
            onPressed: () => context.push("/vehicles/new"),
          ),
        ],
        onSettings: () => context.push("/profile"),
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(partnerProfileProvider);
          ref.invalidate(_dashboardProvider);
          ref.invalidate(_recentBookingsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              PageHeader(
                title: "Welcome back, ${user?.firstName ?? 'Partner'}! 👋",
                subtitle: "Here is your live rental fleet performance.",
                action: profileAsync.maybeWhen(
                  data: (profile) => profile != null
                      ? StatusBadge.verification(profile.verificationStatus)
                      : const SizedBox.shrink(),
                  orElse: () => const SizedBox.shrink(),
                ),
              ),
              const SizedBox(height: 16),

              // Verification Banner if pending/rejected
              profileAsync.maybeWhen(
                data: (profile) => profile != null && profile.verificationStatus != PartnerVerificationStatus.verified
                    ? Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _VerificationBanner(status: profile.verificationStatus),
                      )
                    : const SizedBox.shrink(),
                orElse: () => const SizedBox.shrink(),
              ),

              // Stat Cards Grid
              statsAsync.when(
                data: (stats) => GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  mainAxisExtent: 144,
                  children: [
                    StatCard(
                      label: "Total vehicles",
                      value: "${stats.totalVehicles}",
                      icon: Icons.directions_car_outlined,
                      tone: StatCardTone.secondary,
                      onTap: () => context.push("/vehicles"),
                    ),
                    StatCard(
                      label: "Active bookings",
                      value: "${stats.activeBookings}",
                      icon: Icons.calendar_month_outlined,
                      tone: StatCardTone.accent,
                      onTap: () => context.push("/bookings"),
                    ),
                    StatCard(
                      label: "Pending requests",
                      value: "${stats.pendingRequests}",
                      icon: Icons.pending_actions_outlined,
                      tone: StatCardTone.warning,
                      onTap: () => context.push("/bookings"),
                    ),
                    StatCard(
                      label: "Completed trips",
                      value: "${stats.completedBookings}",
                      icon: Icons.check_circle_outline,
                      tone: StatCardTone.success,
                    ),
                    StatCard(
                      label: "Total revenue",
                      value: formatCurrency(stats.totalRevenue),
                      icon: Icons.payments_outlined,
                      tone: StatCardTone.primary,
                    ),
                    StatCard(
                      label: "Average rating",
                      value: stats.averageRating.toStringAsFixed(1),
                      icon: Icons.star_outline,
                      tone: StatCardTone.accent,
                      onTap: () => context.push("/reviews"),
                    ),
                  ],
                ),
                loading: () => const SectionLoading(),
                error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_dashboardProvider)),
              ),
              const SizedBox(height: 20),

              // Recent Booking Requests Section
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    AppCardHeader(
                      title: "Recent Booking Requests",
                      subtitle: "Incoming trip approvals & handovers",
                      trailing: TextButton(
                        onPressed: () => context.push("/bookings"),
                        child: const Text("View All"),
                      ),
                    ),
                    recentBookingsAsync.when(
                      data: (page) => page.items.isEmpty
                          ? Padding(
                              padding: EdgeInsets.all(24),
                              child: Text("No booking requests yet", style: TextStyle(color: AppColors.mutedTextOf(context))),
                            )
                          : Column(
                              children: [
                                for (final booking in page.items.take(5))
                                  InkWell(
                                    onTap: () => context.push("/bookings/${booking.id}"),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(booking.vehicle?.model ?? "Vehicle", style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                                                const SizedBox(height: 2),
                                                Text(
                                                  "${formatDate(booking.pickupDatetime)} · #${booking.bookingNumber}",
                                                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                                                ),
                                              ],
                                            ),
                                          ),
                                          StatusBadge.booking(booking.status),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                      loading: () => const SectionLoading(),
                      error: (e, _) => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _VerificationBanner extends StatelessWidget {
  final PartnerVerificationStatus status;
  const _VerificationBanner({required this.status});

  @override
  Widget build(BuildContext context) {
    final rejected = status == PartnerVerificationStatus.rejected;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: (rejected ? AppColors.danger : AppColors.warning).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: (rejected ? AppColors.danger : AppColors.warning).withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(rejected ? Icons.error_outline : Icons.hourglass_top, color: rejected ? AppColors.danger : AppColors.warning),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              rejected
                  ? "Your business verification was rejected. Check your documents and profile."
                  : "Your business is awaiting verification. You can list vehicles once approved.",
              style: TextStyle(color: rejected ? AppColors.danger : AppColors.warning, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
