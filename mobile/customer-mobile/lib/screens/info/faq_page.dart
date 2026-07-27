import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/faq/FaqPage.tsx.
class FaqPage extends StatelessWidget {
  const FaqPage({super.key});

  @override
  Widget build(BuildContext context) {
    return HeroScaffold(
      eyebrow: "Help & FAQ",
      title: "Frequently Asked Questions",
      description:
          "Everything you need to know about vehicle bookings, security deposits, driving requirements, and partner onboarding.",
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
            child: Column(
              children: [
                // The web nests the accordion inside an outer Card
                // (`<Card className="p-6 sm:p-8">`), so the questions read as
                // one panel rather than as loose cards on the page background.
                const AppCard(
                  padding: EdgeInsets.all(16),
                  child: FaqAccordion(items: MarketingContent.faqItems),
                ),
                const SizedBox(height: 24),
                Text(
                  "Still have questions?",
                  style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context)),
                ),
                TextButton(
                  onPressed: () => context.push("/contact"),
                  child: const Text("Contact our 24/7 Support Team →"),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
