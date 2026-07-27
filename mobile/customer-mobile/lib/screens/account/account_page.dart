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
              InitialsAvatar(name: user.fullName.isEmpty ? user.email : user.fullName, size: 56),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName.isEmpty ? user.email : user.fullName,
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textOf(context)),
                    ),
                    Text(user.email, style: TextStyle(color: AppColors.mutedTextOf(context))),
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
                _MenuTile(
                  icon: Icons.receipt_long_outlined,
                  label: "Payments",
                  onTap: () => context.push("/account/payments"),
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

          // The public-site pages, reachable from inside the app rather than
          // only from a footer that mobile doesn't have.
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              "MORE",
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: AppColors.mutedTextOf(context),
              ),
            ),
          ),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuTile(icon: Icons.help_outline, label: "Help & FAQ", onTap: () => context.push("/faq")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.mail_outline, label: "Contact us", onTap: () => context.push("/contact")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.article_outlined, label: "Blog", onTap: () => context.push("/blog")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.info_outline, label: "About RentWheels", onTap: () => context.push("/about")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(
                  icon: Icons.storefront_outlined,
                  label: "Become a partner",
                  onTap: () => context.push("/become-a-partner"),
                ),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(icon: Icons.work_outline, label: "Careers", onTap: () => context.push("/careers")),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(
                  icon: Icons.shield_outlined,
                  label: "Privacy Policy",
                  onTap: () => context.push("/privacy-policy"),
                ),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(
                  icon: Icons.gavel_outlined,
                  label: "Terms & Conditions",
                  onTap: () => context.push("/terms-conditions"),
                ),
                const Divider(height: 1, indent: 20, endIndent: 20),
                _MenuTile(
                  icon: Icons.currency_exchange_outlined,
                  label: "Refund Policy",
                  onTap: () => context.push("/refund-policy"),
                ),
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
      leading: Icon(icon, color: AppColors.isDark(context) ? AppColors.primary300 : AppColors.primary600),
      title: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textOf(context))),
      trailing: trailing != null
          ? Text(
              trailing!,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.isDark(context) ? AppColors.accentTextDark : AppColors.secondary,
              ),
            )
          : Icon(Icons.chevron_right, color: AppColors.mutedTextOf(context)),
      onTap: onTap,
    );
  }
}
