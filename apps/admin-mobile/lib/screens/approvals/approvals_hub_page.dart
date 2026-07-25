import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

class ApprovalsHubPage extends ConsumerWidget {
  const ApprovalsHubPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: DashboardTopBar(
        title: "Approvals",
        userName: user?.fullName,
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _HubTile(
            icon: Icons.directions_car_outlined,
            title: "Vehicle approvals",
            subtitle: "Review vehicles pending listing approval",
            onTap: () => context.push("/approvals/vehicles"),
          ),
          _HubTile(
            icon: Icons.storefront_outlined,
            title: "Partner verification",
            subtitle: "Review business KYC and verification status",
            onTap: () => context.push("/approvals/partners"),
          ),
          _HubTile(
            icon: Icons.badge_outlined,
            title: "Driving license review",
            subtitle: "Verify customer driving licenses",
            onTap: () => context.push("/approvals/licenses"),
          ),
        ],
      ),
    );
  }
}

class _HubTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _HubTile({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: EdgeInsets.zero,
        onTap: onTap,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: CircleAvatar(backgroundColor: AppColors.secondary50, child: Icon(icon, color: AppColors.secondary)),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right),
        ),
      ),
    );
  }
}
