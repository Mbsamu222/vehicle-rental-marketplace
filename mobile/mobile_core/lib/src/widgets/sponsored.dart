import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../auth/providers.dart';
import '../models/monetization.dart';
import '../theme/app_colors.dart';
import 'app_card.dart';
import 'marketing.dart';

/// Ports of SponsoredBanner.tsx and AdSlotsBand.tsx. Both feeds are gated
/// server-side on their monetization toggle, so an empty list means "render
/// nothing" — these widgets collapse to [SizedBox.shrink] exactly like the web
/// components' early `return null`.
final affiliatePartnersProvider = FutureProvider.autoDispose<List<AffiliatePartner>>(
  (ref) => ref.watch(marketplaceApiProvider).catalog.affiliatePartners(),
);

final adSlotsProvider = FutureProvider.autoDispose<List<AdSlot>>(
  (ref) => ref.watch(marketplaceApiProvider).catalog.adSlots(),
);

Future<void> _openExternal(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

IconData _affiliateIcon(AffiliateCategory category) => switch (category) {
      AffiliateCategory.insurance => Icons.verified_user_outlined,
      AffiliateCategory.roadsideAssistance => Icons.support_outlined,
      AffiliateCategory.fuel => Icons.local_gas_station_outlined,
      AffiliateCategory.other => Icons.bolt_outlined,
    };

/// The small uppercase "Sponsored" chip both placements are labelled with —
/// disclosure is not optional on paid placements.
class SponsoredChip extends StatelessWidget {
  const SponsoredChip({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.primary50,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        "SPONSORED",
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.7,
          color: isDark ? AppColors.primary300 : AppColors.primary500,
        ),
      ),
    );
  }
}

/// SponsoredBanner.tsx — one affiliate partner at a time, auto-rotating every
/// six seconds with dot indicators.
class SponsoredBanner extends ConsumerStatefulWidget {
  const SponsoredBanner({super.key});

  @override
  ConsumerState<SponsoredBanner> createState() => _SponsoredBannerState();
}

class _SponsoredBannerState extends ConsumerState<SponsoredBanner> {
  int _index = 0;
  Timer? _timer;

  /// Partner count the running timer was built for — the admin can activate or
  /// retire partners while the screen is open, so a timer closed over a stale
  /// count would wrap at the wrong index.
  int _timerCount = 0;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _ensureRotating(int count) {
    if (_timer != null && _timerCount == count) return;
    _timer?.cancel();
    _timer = null;
    _timerCount = count;
    if (count < 2) return;
    _timer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % count);
    });
  }

  @override
  Widget build(BuildContext context) {
    final partners = ref.watch(affiliatePartnersProvider).valueOrNull ?? const <AffiliatePartner>[];
    if (partners.isEmpty) return const SizedBox.shrink();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _ensureRotating(partners.length);
    });
    // The feed can shrink under us; keep the index inside the current list so
    // the dot indicators and tap handlers agree with what's rendered.
    if (_index >= partners.length) _index = 0;
    final sponsor = partners[_index];
    final isDark = AppColors.isDark(context);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconTile(
                icon: _affiliateIcon(sponsor.category),
                background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
                foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
                size: 46,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const SponsoredChip(),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            sponsor.name,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                          ),
                        ),
                      ],
                    ),
                    if (sponsor.tagline != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        sponsor.tagline!,
                        style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              TextButton(
                onPressed: () => _openExternal(sponsor.referralUrl),
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      sponsor.ctaLabel ?? "Learn more",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppColors.accentTextDark : AppColors.secondary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.arrow_forward, size: 13, color: isDark ? AppColors.accentTextDark : AppColors.secondary),
                  ],
                ),
              ),
              const Spacer(),
              if (partners.length > 1)
                for (var i = 0; i < partners.length; i++)
                  GestureDetector(
                    onTap: () => setState(() => _index = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.only(left: 5),
                      height: 6,
                      width: i == _index ? 20 : 6,
                      decoration: BoxDecoration(
                        color: i == _index
                            ? (isDark ? AppColors.accentTextDark : AppColors.secondary)
                            : (isDark ? Colors.white.withValues(alpha: 0.15) : AppColors.primary100),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
            ],
          ),
        ],
      ),
    );
  }
}

/// AdSlotsBand.tsx — a stack of image + copy sponsored cards.
class AdSlotsBand extends ConsumerWidget {
  const AdSlotsBand({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slots = ref.watch(adSlotsProvider).valueOrNull ?? const <AdSlot>[];
    if (slots.isEmpty) return const SizedBox.shrink();

    final isDark = AppColors.isDark(context);
    return Column(
      children: [
        for (final slot in slots) ...[
          AppCard(
            padding: const EdgeInsets.all(12),
            onTap: slot.ctaUrl == null ? null : () => _openExternal(slot.ctaUrl!),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: slot.imageUrl,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) => Container(
                      width: 56,
                      height: 56,
                      color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.primary50,
                      child: Icon(Icons.image_outlined, color: AppColors.mutedTextOf(context)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SponsoredChip(),
                      const SizedBox(height: 4),
                      Text(
                        slot.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                      ),
                      if (slot.subtitle != null)
                        Text(
                          slot.subtitle!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                        ),
                    ],
                  ),
                ),
                if (slot.ctaLabel != null) ...[
                  const SizedBox(width: 8),
                  Icon(Icons.arrow_forward, size: 15, color: isDark ? AppColors.accentTextDark : AppColors.secondary),
                ],
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}
