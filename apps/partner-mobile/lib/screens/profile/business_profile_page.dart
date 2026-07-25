import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import '../../providers/partner_profile_provider.dart';

class BusinessProfilePage extends ConsumerWidget {
  const BusinessProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(partnerProfileProvider);
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: DashboardTopBar(
        title: "Business Profile",
        userName: user?.fullName,
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: profileAsync.when(
        data: (profile) {
          if (profile == null) return const SizedBox.shrink();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(profile.businessName, style: Theme.of(context).textTheme.titleLarge)),
                        StatusBadge.verification(profile.verificationStatus),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(profile.city?.name ?? "", style: const TextStyle(color: AppColors.primary400)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        StarRatingDisplay(rating: profile.averageRating),
                        const SizedBox(width: 8),
                        Text("${profile.averageRating.toStringAsFixed(1)} (${profile.totalReviews} reviews)"),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _MenuTile(icon: Icons.edit_outlined, label: "Edit business details", onTap: () => context.push("/profile/edit")),
                    const Divider(height: 1, indent: 20, endIndent: 20),
                    _MenuTile(icon: Icons.description_outlined, label: "KYC documents", onTap: () => context.push("/profile/documents")),
                    const Divider(height: 1, indent: 20, endIndent: 20),
                    _MenuTile(icon: Icons.account_balance_outlined, label: "Bank details", onTap: () => context.push("/profile/bank-details")),
                    const Divider(height: 1, indent: 20, endIndent: 20),
                    _MenuTile(icon: Icons.support_agent_outlined, label: "Support", onTap: () => context.push("/support")),
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
          );
        },
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(partnerProfileProvider)),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      leading: Icon(icon, color: AppColors.primary600),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.primary300),
      onTap: onTap,
    );
  }
}
