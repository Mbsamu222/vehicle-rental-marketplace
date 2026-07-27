import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/support/SupportPage.tsx — the support
/// landing page that routes to FAQ, the contact form, and (for signed-in
/// customers) their ticket list.
class SupportPage extends ConsumerWidget {
  const SupportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signedIn = ref.watch(authControllerProvider).isAuthenticated;

    return HeroScaffold(
      eyebrow: "Customer Support",
      title: "We're Here to Help",
      description:
          "We're available 24/7 to assist with your bookings, payments, rental partner inquiries, and account settings.",
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
            child: Column(
              children: [
                _SupportOption(
                  icon: Icons.help_outline,
                  title: "Browse Help & FAQ",
                  description:
                      "Find fast answers to common questions regarding driving requirements, deposit refunds, and cancellation rules.",
                  actionLabel: "Explore FAQ Articles",
                  onTap: () => context.push("/faq"),
                ),
                const SizedBox(height: 12),
                _SupportOption(
                  icon: Icons.mail_outline,
                  title: "Contact Support Team",
                  description:
                      "Send us a direct message and our dedicated support team will respond by email within 24 hours.",
                  actionLabel: "Go to Contact Form",
                  onTap: () => context.push("/contact"),
                ),
                const SizedBox(height: 12),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Already Have an Active Booking?",
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        signedIn
                            ? "Raise a support ticket against a booking and track live trip updates."
                            : "Log in to your customer account to raise a support ticket and track live trip updates.",
                        style: TextStyle(fontSize: 12.5, height: 1.55, color: AppColors.mutedTextOf(context)),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => context.push(
                            signedIn ? "/account/support" : "/login?redirect=${Uri.encodeComponent("/account/support")}",
                          ),
                          child: Text(signedIn ? "My Support Tickets" : "Log in to continue"),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SupportOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onTap;

  const _SupportOption({
    required this.icon,
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(
            icon: icon,
            background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
            foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
          ),
          const SizedBox(height: 16),
          Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textOf(context))),
          const SizedBox(height: 6),
          Text(description, style: TextStyle(fontSize: 12.5, height: 1.55, color: AppColors.mutedTextOf(context))),
          const SizedBox(height: 14),
          Row(
            children: [
              Text(
                actionLabel,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppColors.accentTextDark : AppColors.secondary,
                ),
              ),
              const SizedBox(width: 5),
              Icon(Icons.arrow_forward, size: 14, color: isDark ? AppColors.accentTextDark : AppColors.secondary),
            ],
          ),
        ],
      ),
    );
  }
}
