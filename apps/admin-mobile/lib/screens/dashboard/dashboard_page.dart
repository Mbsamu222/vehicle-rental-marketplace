import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _dashboardProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.dashboard());

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(_dashboardProvider);
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: DashboardTopBar(
        title: "Platform Overview",
        userName: user?.fullName,
        onToggleTheme: () => ref.read(themeModeProvider.notifier).toggleTheme(),
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_dashboardProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Page Header
              PageHeader(
                title: "Platform Overview & Control",
                subtitle: "Welcome back${user != null && user.fullName.isNotEmpty ? ', ${user.fullName}' : ''}! Real-time marketplace metrics.",
              ),
              const SizedBox(height: 20),

              // Stat Cards Grid
              statsAsync.when(
                data: (stats) => Column(
                  children: [
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.25,
                      children: [
                        StatCard(
                          label: "Total customers",
                          value: "${stats.totalCustomers}",
                          icon: Icons.people_outline,
                          tone: StatCardTone.secondary,
                          onTap: () => context.push("/users"),
                        ),
                        StatCard(
                          label: "Rental partners",
                          value: "${stats.totalPartners}",
                          icon: Icons.storefront_outlined,
                          tone: StatCardTone.primary,
                          subtitle: "${stats.verifiedPartners} verified",
                          onTap: () => context.push("/approvals/partners"),
                        ),
                        StatCard(
                          label: "Verified partners",
                          value: "${stats.verifiedPartners}",
                          icon: Icons.verified_user_outlined,
                          tone: StatCardTone.success,
                          onTap: () => context.push("/approvals/partners"),
                        ),
                        StatCard(
                          label: "Total vehicles",
                          value: "${stats.totalVehicles}",
                          icon: Icons.directions_car_outlined,
                          tone: StatCardTone.accent,
                          subtitle: "${stats.pendingVehicleApprovals} pending",
                          onTap: () => context.push("/approvals/vehicles"),
                        ),
                        StatCard(
                          label: "Pending approvals",
                          value: "${stats.pendingVehicleApprovals}",
                          icon: Icons.access_time_rounded,
                          tone: StatCardTone.warning,
                          onTap: () => context.push("/approvals/vehicles"),
                        ),
                        StatCard(
                          label: "Total bookings",
                          value: "${stats.totalBookings}",
                          icon: Icons.calendar_month_outlined,
                          tone: StatCardTone.secondary,
                          subtitle: "${stats.activeBookings} active",
                        ),
                        StatCard(
                          label: "Active trips",
                          value: "${stats.activeBookings}",
                          icon: Icons.local_activity_outlined,
                          tone: StatCardTone.accent,
                        ),
                        StatCard(
                          label: "Total revenue",
                          value: formatCurrency(stats.totalRevenue),
                          icon: Icons.payments_outlined,
                          tone: StatCardTone.success,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Support Tickets Card
                    AppCard(
                      padding: EdgeInsets.zero,
                      child: AppCardHeader(
                        title: "Pending Support Tickets",
                        subtitle: "${stats.pendingSupportTickets} ticket${stats.pendingSupportTickets == 1 ? '' : 's'} awaiting response.",
                        trailing: TextButton.icon(
                          onPressed: () => context.push("/support"),
                          icon: const Icon(Icons.arrow_forward, size: 16),
                          label: const Text("View Tickets"),
                        ),
                      ),
                    ),
                  ],
                ),
                loading: () => const SectionLoading(),
                error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_dashboardProvider)),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
