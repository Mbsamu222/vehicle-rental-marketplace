import 'package:flutter/material.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/about/AboutPage.tsx.
class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);

    return HeroScaffold(
      eyebrow: "About RentWheels",
      title: "Renting a vehicle, reimagined",
      description:
          "We started RentWheels with a simple idea: renting a vehicle shouldn't require phone calls, paperwork chases, or guessing at prices.",
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 28, 16, 8),
          sliver: SliverList.separated(
            itemCount: MarketingContent.aboutValues.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final value = MarketingContent.aboutValues[i];
              return AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconTile(
                      icon: value.icon,
                      background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
                      foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      value.title,
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      value.description,
                      style: TextStyle(fontSize: 12.5, height: 1.55, color: AppColors.mutedTextOf(context)),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        SliverToBoxAdapter(
          child: Container(
            width: double.infinity,
            margin: const EdgeInsets.only(top: 24),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
            color: isDark ? Colors.white.withValues(alpha: 0.02) : AppColors.primary50.withValues(alpha: 0.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionHeading(eyebrow: "Our story", title: "How RentWheels came to be", centered: true),
                const SizedBox(height: 20),
                for (final paragraph in MarketingContent.aboutStory) ...[
                  Text(
                    paragraph,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.7,
                      color: isDark ? AppColors.primary200 : AppColors.primary500,
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
