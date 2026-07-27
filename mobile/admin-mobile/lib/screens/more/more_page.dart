import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// The admin console's remaining sections. admin-web puts every one of these in
/// a persistent sidebar; a phone has room for five tabs, so the two highest
/// frequency queues (approvals, support) stay as tabs and the rest live here.
class MorePage extends ConsumerWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final isDark = AppColors.isDark(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("More"),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round_outlined),
            tooltip: isDark ? "Switch to light mode" : "Switch to dark mode",
            onPressed: () => ref.read(themeModeProvider.notifier).toggleTheme(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user != null) ...[
            AppCard(
              child: Row(
                children: [
                  InitialsAvatar(name: user.fullName.isEmpty ? user.email : user.fullName, size: 48),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.fullName.isEmpty ? user.email : user.fullName,
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                        ),
                        Text(user.email, style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
          ],
          _Group(
            label: "Marketplace",
            children: [
              _Tile(icon: Icons.local_offer_outlined, label: "Coupons", route: "/coupons"),
              _Tile(icon: Icons.category_outlined, label: "Catalog", route: "/catalog"),
              _Tile(icon: Icons.receipt_long_outlined, label: "Transactions", route: "/transactions"),
            ],
          ),
          const SizedBox(height: 14),
          _Group(
            label: "Content & revenue",
            children: [
              _Tile(icon: Icons.edit_document, label: "Content (CMS & blog)", route: "/cms"),
              _Tile(icon: Icons.payments_outlined, label: "Monetization", route: "/monetization"),
            ],
          ),
          const SizedBox(height: 14),
          _Group(
            label: "Administration",
            children: [
              _Tile(icon: Icons.shield_outlined, label: "Roles & permissions", route: "/roles"),
              _Tile(icon: Icons.history, label: "Audit logs", route: "/audit-logs"),
              _Tile(icon: Icons.notifications_outlined, label: "Notifications", route: "/notifications"),
              _Tile(icon: Icons.settings_outlined, label: "Settings", route: "/settings"),
            ],
          ),
          const SizedBox(height: 20),
          LoadingButton(
            label: "Log out",
            outlined: true,
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go("/login");
            },
          ),
        ],
      ),
    );
  }
}

class _Group extends StatelessWidget {
  final String label;
  final List<Widget> children;
  const _Group({required this.label, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label.toUpperCase(),
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
              for (var i = 0; i < children.length; i++) ...[
                children[i],
                if (i != children.length - 1) const Divider(height: 1, indent: 20, endIndent: 20),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String route;
  const _Tile({required this.icon, required this.label, required this.route});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      leading: Icon(icon, color: AppColors.isDark(context) ? AppColors.primary300 : AppColors.primary600),
      title: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textOf(context))),
      trailing: Icon(Icons.chevron_right, color: AppColors.mutedTextOf(context)),
      onTap: () => context.push(route),
    );
  }
}
