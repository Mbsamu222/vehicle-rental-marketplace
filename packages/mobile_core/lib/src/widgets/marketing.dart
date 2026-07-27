import 'package:flutter/material.dart';

import '../data/marketing_content.dart';
import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';
import 'app_card.dart';
import 'common.dart';

/// The public-site marketing sections, ported one-for-one from
/// apps/public-site (HomePage.tsx, FaqAccordion.tsx, NewsletterSignup.tsx,
/// PageHero.tsx, Eyebrow.tsx). They live in mobile_core rather than in
/// customer-mobile so the copy, spacing, and colour choices stay in step with
/// the web build instead of drifting per screen.

/// Tone variants of [Eyebrow], mirroring packages/ui Eyebrow.tsx.
enum EyebrowTone { secondary, accent, light }

/// packages/ui Eyebrow.tsx — a 24x1px rule followed by uppercase letterspaced
/// text. Deliberately NOT a pill: the web renders
/// `inline-flex gap-2 text-xs font-semibold uppercase tracking-[0.16em]` with a
/// `h-px w-6` leading rule, and `tracking-[0.16em]` on a 12px font is 1.92px of
/// letter spacing.
class Eyebrow extends StatelessWidget {
  final String text;
  final bool centered;
  final EyebrowTone tone;

  const Eyebrow({
    super.key,
    required this.text,
    this.centered = false,
    this.tone = EyebrowTone.secondary,
  });

  @override
  Widget build(BuildContext context) {
    final color = switch (tone) {
      EyebrowTone.secondary => AppColors.isDark(context) ? AppColors.infoTextDark : AppColors.secondary,
      EyebrowTone.accent => AppColors.accent,
      EyebrowTone.light => Colors.white.withValues(alpha: 0.8),
    };
    // The web rule is `bg-white/50` on the light tone and `bg-current/50`
    // otherwise, so it always reads as a dimmed version of the label colour.
    final ruleColor = tone == EyebrowTone.light
        ? Colors.white.withValues(alpha: 0.5)
        : color.withValues(alpha: 0.5);

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: centered ? MainAxisAlignment.center : MainAxisAlignment.start,
      children: [
        Container(width: 24, height: 1, color: ruleColor),
        const SizedBox(width: 8),
        Text(
          text.toUpperCase(),
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.92,
          ),
        ),
      ],
    );
  }
}

/// The `Eyebrow + h2 + lead paragraph` block that opens every marketing
/// section on the web home page.
class SectionHeading extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String? subtitle;
  final bool centered;
  final Widget? action;

  const SectionHeading({
    super.key,
    required this.eyebrow,
    required this.title,
    this.subtitle,
    this.centered = false,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final column = Column(
      crossAxisAlignment: centered ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: [
        Eyebrow(text: eyebrow, centered: centered),
        const SizedBox(height: 8),
        Text(
          title,
          textAlign: centered ? TextAlign.center : TextAlign.start,
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, height: 1.2, color: AppColors.textOf(context)),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            textAlign: centered ? TextAlign.center : TextAlign.start,
            style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.mutedTextOf(context)),
          ),
        ],
      ],
    );

    if (action == null) return column;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [Expanded(child: column), const SizedBox(width: 12), action!],
    );
  }
}

/// The tinted rounded-square icon tile used by categories, steps, and feature
/// cards across the web app (`size-14 rounded-2xl bg-*-50 text-*-600`).
class IconTile extends StatelessWidget {
  final IconData icon;
  final Color background;
  final Color foreground;
  final double size;
  const IconTile({
    super.key,
    required this.icon,
    required this.background,
    required this.foreground,
    this.size = 48,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(size / 3.2)),
      child: Icon(icon, color: foreground, size: size * 0.45),
    );
  }
}

/// The "4.9/5 rating · verified partners · instant pickups" strip under the
/// home hero.
class TrustStrip extends StatelessWidget {
  const TrustStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _TrustItem(icon: Icons.star, label: "4.9/5 Rating", color: Color(0xFFF59E0B)),
        _TrustItem(icon: Icons.verified_user, label: "Verified Partners", color: AppColors.secondary),
        _TrustItem(icon: Icons.flash_on, label: "Instant Pickups", color: AppColors.accent600),
      ],
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _TrustItem({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.mutedTextOf(context))),
      ],
    );
  }
}

/// HomePage.tsx "SECTION 5: HOW IT WORKS" — a numbered five-step list. The web
/// lays these out horizontally on a connector line; on a phone the same steps
/// read better stacked, so the connector becomes a vertical rail.
class HowItWorksSection extends StatelessWidget {
  const HowItWorksSection({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final steps = MarketingContent.howItWorksSteps;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < steps.length; i++)
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    IconTile(
                      icon: steps[i].icon,
                      background: isDark ? Colors.white : AppColors.primary900,
                      foreground: isDark ? AppColors.primary900 : Colors.white,
                      size: 44,
                    ),
                    if (i != steps.length - 1)
                      Expanded(
                        child: Container(width: 2, color: AppColors.borderOf(context)),
                      ),
                  ],
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: i == steps.length - 1 ? 0 : 24, top: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "0${i + 1}. ${steps[i].title}",
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          steps[i].description,
                          style: TextStyle(fontSize: 12.5, height: 1.5, color: AppColors.mutedTextOf(context)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// HomePage.tsx "SECTION 6: WHY CHOOSE US" bento grid — the first item renders
/// as the large dark feature panel, the rest as regular cards.
class WhyChooseUsSection extends StatelessWidget {
  const WhyChooseUsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final items = MarketingContent.whyChooseUs;
    final feature = items.first;

    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.primary900,
            borderRadius: BorderRadius.circular(20),
            border: isDark ? Border.all(color: Colors.white.withValues(alpha: 0.1)) : null,
            boxShadow: AppShadows.soft,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              IconTile(
                icon: feature.icon,
                background: Colors.white.withValues(alpha: 0.1),
                foreground: Colors.white,
                size: 52,
              ),
              const SizedBox(height: 24),
              Text(feature.title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white)),
              const SizedBox(height: 8),
              Text(
                feature.description,
                style: TextStyle(fontSize: 13, height: 1.55, color: Colors.white.withValues(alpha: 0.7)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        for (final item in items.skip(1)) ...[
          AppCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconTile(
                  icon: item.icon,
                  background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
                  foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
                  size: 42,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.description,
                        style: TextStyle(fontSize: 12.5, height: 1.5, color: AppColors.mutedTextOf(context)),
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
    );
  }
}

/// HomePage.tsx "SECTION 7" — the horizontally snapping testimonial carousel.
class TestimonialsSection extends StatelessWidget {
  const TestimonialsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return SizedBox(
      height: 232,
      child: PageView.builder(
        controller: PageController(viewportFraction: (width - 56) / width),
        padEnds: false,
        itemCount: MarketingContent.testimonials.length,
        itemBuilder: (context, i) {
          final t = MarketingContent.testimonials[i];
          return Padding(
            padding: EdgeInsets.only(left: i == 0 ? 16 : 6, right: 6),
            child: AppCard(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StarRatingDisplay(rating: t.rating, size: 15),
                  const SizedBox(height: 14),
                  Expanded(
                    child: Text(
                      "“${t.quote}”",
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.55,
                        fontWeight: FontWeight.w500,
                        color: AppColors.isDark(context) ? AppColors.primary100 : AppColors.primary700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Divider(height: 1, color: AppColors.borderOf(context)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      InitialsAvatar(name: t.name, size: 36),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t.name,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                            ),
                            Text(t.role, style: TextStyle(fontSize: 11, color: AppColors.mutedTextOf(context))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// packages/ui Avatar.tsx — initials on a tinted circle, used wherever there is
/// no uploaded photo.
class InitialsAvatar extends StatelessWidget {
  final String name;
  final double size;
  const InitialsAvatar({super.key, required this.name, this.size = 40});

  String get _initials {
    final parts = name.trim().split(RegExp(r"\s+")).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return "?";
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isDark ? AppColors.infoBgDark : AppColors.secondary100,
        shape: BoxShape.circle,
      ),
      child: Text(
        _initials,
        style: TextStyle(
          fontSize: size * 0.36,
          fontWeight: FontWeight.w800,
          color: isDark ? AppColors.infoTextDark : AppColors.secondaryHover,
        ),
      ),
    );
  }
}

/// HomePage.tsx "SECTION 8" — the dark stats band. The web animates each number
/// up when it scrolls into view; [StatsBand] does the same with a one-shot
/// tween so the section doesn't feel static on mobile either.
class StatsBand extends StatelessWidget {
  const StatsBand({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      color: isDark ? AppColors.darkSurface : AppColors.primary900,
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 12,
        runSpacing: 26,
        children: [
          for (final stat in MarketingContent.stats)
            SizedBox(
              width: (MediaQuery.sizeOf(context).width - 52) / 2,
              child: Column(
                children: [
                  _StatCounter(value: stat.value),
                  const SizedBox(height: 6),
                  Text(
                    stat.label.toUpperCase(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Mirrors HomePage.tsx's `StatCounter`: pull the number out of a display
/// string like "1,000+" or "4.7 / 5", ease it up from zero, and re-attach the
/// original prefix/suffix so the formatting is preserved exactly.
class _StatCounter extends StatelessWidget {
  final String value;
  const _StatCounter({required this.value});

  @override
  Widget build(BuildContext context) {
    final match = RegExp(r"-?\d+(?:,\d{3})*(?:\.\d+)?").firstMatch(value);
    if (match == null) {
      return Text(value, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white));
    }

    final raw = match[0]!;
    final numeric = double.tryParse(raw.replaceAll(",", "")) ?? 0;
    final decimals = raw.contains(".") ? raw.split(".")[1].length : 0;
    final prefix = value.substring(0, match.start);
    final suffix = value.substring(match.end);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: numeric),
      duration: const Duration(milliseconds: 1400),
      curve: Curves.easeOutCubic,
      builder: (context, animated, _) {
        final body = decimals > 0
            ? animated.toStringAsFixed(decimals)
            : _withThousandsSeparators(animated.round());
        return Text(
          "$prefix$body$suffix",
          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
        );
      },
    );
  }

  static String _withThousandsSeparators(int n) =>
      n.toString().replaceAllMapped(RegExp(r"\B(?=(\d{3})+(?!\d))"), (m) => ",");
}

/// FaqAccordion.tsx — expandable question list.
class FaqAccordion extends StatefulWidget {
  final List<FaqItem> items;
  const FaqAccordion({super.key, required this.items});

  @override
  State<FaqAccordion> createState() => _FaqAccordionState();
}

class _FaqAccordionState extends State<FaqAccordion> {
  /// The web opens the first question by default (`useState<number | null>(0)`),
  /// so the panel is never a stack of closed rows on first paint.
  int? _open = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < widget.items.length; i++) ...[
          AppCard(
            padding: EdgeInsets.zero,
            onTap: () => setState(() => _open = _open == i ? null : i),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // `px-5 py-4` on the web's trigger button.
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          widget.items[i].question,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textOf(context)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      AnimatedRotation(
                        turns: _open == i ? 0.5 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(Icons.keyboard_arrow_down, size: 18, color: AppColors.mutedTextOf(context)),
                      ),
                    ],
                  ),
                ),
                AnimatedCrossFade(
                  firstChild: const SizedBox(width: double.infinity),
                  secondChild: Padding(
                    // `px-5 pb-4`, with no extra top padding — the trigger's
                    // own bottom padding already separates them.
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: SizedBox(
                      width: double.infinity,
                      child: Text(
                        widget.items[i].answer,
                        style: TextStyle(fontSize: 14, height: 1.55, color: AppColors.mutedTextOf(context)),
                      ),
                    ),
                  ),
                  crossFadeState: _open == i ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),
              ],
            ),
          ),
          if (i != widget.items.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }
}

/// The newsletter banner that closes the web home page. On mobile the signup
/// itself is a no-op stub on the web too (there is no subscribe endpoint), so
/// this renders the same invitation with an honest confirmation rather than
/// pretending to POST somewhere.
class NewsletterBanner extends StatefulWidget {
  const NewsletterBanner({super.key});

  @override
  State<NewsletterBanner> createState() => _NewsletterBannerState();
}

class _NewsletterBannerState extends State<NewsletterBanner> {
  final _controller = TextEditingController();
  bool _submitted = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
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
          const Text("Stay in the loop", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
          const SizedBox(height: 6),
          Text(
            "Get new city launches, partner offers, and product updates in your inbox.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, height: 1.5, color: Colors.white.withValues(alpha: 0.75)),
          ),
          const SizedBox(height: 18),
          if (_submitted)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle, color: AppColors.success, size: 18),
                const SizedBox(width: 8),
                Text(
                  "Thanks — we'll be in touch.",
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontWeight: FontWeight.w600),
                ),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: "you@example.com",
                      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.1),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Colors.white),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary900),
                    onPressed: () {
                      if (!_controller.text.contains("@")) return;
                      setState(() => _submitted = true);
                    },
                    child: const Text("Join"),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

/// HomePage.tsx "SECTION 9" — the app-download card. Inside the app itself the
/// store buttons would be circular, so this renders as a "you're already on the
/// app" confirmation instead of dead CTAs.
class AppPerksCard extends StatelessWidget {
  const AppPerksCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return AppCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconTile(
            icon: Icons.phone_iphone,
            background: isDark ? AppColors.accentBgDark : AppColors.accent100,
            foreground: isDark ? AppColors.accentTextDark : AppColors.accent600,
            size: 46,
          ),
          const SizedBox(height: 16),
          Text(
            "You're on the RentWheels app",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
          ),
          const SizedBox(height: 6),
          Text(
            "Faster bookings, live trip tracking, and app-only discounts are all switched on for this account.",
            style: TextStyle(fontSize: 13, height: 1.55, color: AppColors.mutedTextOf(context)),
          ),
        ],
      ),
    );
  }
}
