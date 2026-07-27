import 'package:flutter/material.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/careers/CareersPage.tsx. There is no
/// backend model for job postings, so the list is the same static placeholder
/// the web renders and "Apply" opens a mail composer rather than a form.
class CareersPage extends StatelessWidget {
  const CareersPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final positions = MarketingContent.openPositions;

    return HeroScaffold(
      eyebrow: "We're Hiring",
      title: "Careers at RentWheels",
      description:
          "We're a fast-moving team building the easiest way to rent a vehicle. If that sounds like your kind of problem to solve, we'd love to hear from you.",
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionHeading(eyebrow: "Join Our Team", title: "Open Positions"),
                const SizedBox(height: 18),
                if (positions.isEmpty)
                  const EmptyState(
                    icon: Icons.work_outline,
                    title: "No open positions right now",
                    message: "Check back soon, or send us your resume anyway.",
                  )
                else
                  for (final role in positions) ...[
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            role.title,
                            style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 14,
                            runSpacing: 6,
                            children: [
                              _RoleMeta(icon: Icons.work_outline, label: role.department),
                              _RoleMeta(icon: Icons.location_on_outlined, label: role.location),
                              _RoleMeta(icon: Icons.schedule_outlined, label: role.type),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () => launchEmail(
                                MarketingContent.careersEmail,
                                subject: "Application — ${role.title}",
                              ),
                              icon: const Text("Apply Now"),
                              label: const Icon(Icons.arrow_forward, size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Container(
            width: double.infinity,
            margin: const EdgeInsets.only(top: 20),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 34),
            color: isDark ? AppColors.darkSurface : AppColors.primary900,
            child: Column(
              children: [
                IconTile(
                  icon: Icons.mail_outline,
                  background: Colors.white.withValues(alpha: 0.1),
                  foreground: Colors.white,
                  size: 46,
                ),
                const SizedBox(height: 14),
                const Text(
                  "Don't See a Direct Fit?",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                const SizedBox(height: 8),
                Text(
                  "Reach out anytime — we're always happy to connect with talented people.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, height: 1.55, color: Colors.white.withValues(alpha: 0.75)),
                ),
                const SizedBox(height: 14),
                TextButton(
                  onPressed: () => launchEmail(MarketingContent.careersEmail),
                  child: Text(
                    MarketingContent.careersEmail,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                      decorationColor: Colors.white,
                    ),
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

class _RoleMeta extends StatelessWidget {
  final IconData icon;
  final String label;
  const _RoleMeta({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.secondary),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.mutedTextOf(context)),
        ),
      ],
    );
  }
}
