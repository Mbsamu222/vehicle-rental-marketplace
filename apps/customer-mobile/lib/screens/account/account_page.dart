import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _dashboardProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).users.dashboard());

class AccountPage extends ConsumerWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text("Account")),
        body: EmptyState(
          icon: Icons.person_outline,
          title: "Sign in to manage your account",
          action: ElevatedButton(onPressed: () => context.push("/login"), child: const Text("Sign in")),
        ),
      );
    }

    final user = auth.user!;
    final dashboard = ref.watch(_dashboardProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Account")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              CircleAvatar(radius: 28, backgroundColor: AppColors.secondary50, child: Text(user.firstName.isNotEmpty ? user.firstName[0].toUpperCase() : "?", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.secondary))),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.fullName.isEmpty ? user.email : user.fullName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    Text(user.email, style: const TextStyle(color: AppColors.primary400)),
                  ],
                ),
              ),
              IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => context.push("/account/edit")),
            ],
          ),
          const SizedBox(height: 20),
          dashboard.when(
            data: (stats) => Row(
              children: [
                Expanded(
                  child: StatCard(
                    label: "Active",
                    value: "${stats.activeBookings}",
                    icon: Icons.calendar_month_outlined,
                    tone: StatCardTone.accent,
                    onTap: () => context.push("/bookings"),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: StatCard(
                    label: "Completed",
                    value: "${stats.completedBookings}",
                    icon: Icons.check_circle_outline,
                    tone: StatCardTone.success,
                    onTap: () => context.push("/bookings"),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: StatCard(
                    label: "Wishlist",
                    value: "${stats.wishlistCount}",
                    icon: Icons.favorite_border,
                    tone: StatCardTone.danger,
                    onTap: () => context.push("/wishlist"),
                  ),
                ),
              ],
            ),
            loading: () => const SectionLoading(),
            error: (e, _) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 24),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuTile(
                  icon: Icons.account_balance_wallet_outlined,
                  label: "Wallet",
                  trailing: dashboard.maybeWhen(data: (s) => formatCurrency(s.walletBalance), orElse: () => null),
                  onTap: () => context.push("/account/wallet"),
                ),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.badge_outlined, label: "Driving licenses", onTap: () => context.push("/account/licenses")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.location_on_outlined, label: "Saved locations", onTap: () => context.push("/account/locations")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.notifications_outlined, label: "Notifications", onTap: () => context.push("/account/notifications")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.support_agent_outlined, label: "Support", onTap: () => context.push("/account/support")),
              ],
            ),
          ),
          const SizedBox(height: 20),
          LoadingButton(
            label: "Log out",
            outlined: true,
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go("/");
            },
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;
  final VoidCallback onTap;
  const _MenuTile({required this.icon, required this.label, this.trailing, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      leading: Icon(icon, color: AppColors.primary600),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: trailing != null
          ? Text(trailing!, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.secondary))
          : const Icon(Icons.chevron_right, color: AppColors.primary300),
      onTap: onTap,
    );
  }
}
