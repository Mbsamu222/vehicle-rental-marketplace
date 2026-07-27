import 'package:flutter/material.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/partner/BecomePartnerPage.tsx.
///
/// The CTA opens partner signup in the browser for the same reason the web
/// page does: partner accounts are created in the partner app, not here. See
/// [AppConfig.partnerWebUrl] for how to point it at a deployed host.
class BecomePartnerPage extends StatelessWidget {
  const BecomePartnerPage({super.key});

  void _openSignup() => launchExternalUrl("${AppConfig.partnerWebUrl}/register");

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);

    return HeroScaffold(
      eyebrow: "For Rental Businesses",
      title: "Grow Your Rental Business with RentWheels",
      description:
          "Join dozens of verified rental partners reaching thousands of renters across Chennai. List your fleet, set your own prices, and manage everything from one unified dashboard.",
      heroChild: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary900),
              onPressed: _openSignup,
              icon: const Text("Become a Partner"),
              label: const Icon(Icons.arrow_forward, size: 18),
            ),
          ),
          const SizedBox(height: 24),
          Divider(color: Colors.white.withValues(alpha: 0.1), height: 1),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              for (final stat in MarketingContent.partnerHeroStats)
                Column(
                  children: [
                    Text(
                      stat.value,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stat.label.toUpperCase(),
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: Colors.white.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 32, 16, 0),
            child: Column(
              children: [
                const SectionHeading(
                  eyebrow: "Partner Benefits",
                  title: "Everything You Need to Grow",
                  centered: true,
                ),
                const SizedBox(height: 22),
                for (final benefit in MarketingContent.partnerBenefits) ...[
                  AppCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        IconTile(
                          icon: benefit.icon,
                          background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
                          foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
                          size: 44,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                benefit.title,
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                              ),
                              const SizedBox(height: 5),
                              Text(
                                benefit.description,
                                style: TextStyle(fontSize: 12.5, height: 1.55, color: AppColors.mutedTextOf(context)),
                              ),
                            ],
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

        // Onboarding steps
        SliverToBoxAdapter(
          child: Container(
            width: double.infinity,
            margin: const EdgeInsets.only(top: 20),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
            color: isDark ? Colors.white.withValues(alpha: 0.02) : AppColors.primary50.withValues(alpha: 0.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionHeading(
                  eyebrow: "Onboarding Process",
                  title: "Getting Started is Simple",
                  centered: true,
                ),
                const SizedBox(height: 26),
                for (final (i, entry) in MarketingContent.partnerOnboardingSteps.entries.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white : AppColors.primary900,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            "${i + 1}",
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: isDark ? AppColors.primary900 : Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                entry.key,
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                entry.value,
                                style: TextStyle(fontSize: 12.5, height: 1.5, color: AppColors.mutedTextOf(context)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),

        // Partner testimonial
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 28),
            child: AppCard(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StarRatingDisplay(rating: MarketingContent.partnerTestimonial.rating, size: 16),
                  const SizedBox(height: 14),
                  Text(
                    "“${MarketingContent.partnerTestimonial.quote}”",
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.6,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.primary100 : AppColors.primary700,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Divider(height: 1, color: AppColors.borderOf(context)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      InitialsAvatar(name: MarketingContent.partnerTestimonial.name, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              MarketingContent.partnerTestimonial.name,
                              style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                            ),
                            Text(
                              MarketingContent.partnerTestimonial.role,
                              style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),

        // Closing CTA
        SliverToBoxAdapter(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
            color: isDark ? AppColors.darkSurface : AppColors.primary900,
            child: Column(
              children: [
                const Text(
                  "Ready to List Your First Vehicle?",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                const SizedBox(height: 10),
                Text(
                  "It only takes a few minutes to create your partner account and start reaching renters across Chennai.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, height: 1.55, color: Colors.white.withValues(alpha: 0.75)),
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary900),
                    onPressed: _openSignup,
                    icon: const Text("Become a Partner"),
                    label: const Icon(Icons.arrow_forward, size: 18),
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
