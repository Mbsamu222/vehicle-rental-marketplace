import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/providers.dart';
import '../models/catalog.dart';
import '../theme/app_colors.dart';

/// Admin-managed promo slides (CMS → Hero banners), the same feed the web
/// HeroSlider.tsx reads.
final heroBannersProvider = FutureProvider.autoDispose<List<HeroBannerSlide>>(
  (ref) => ref.watch(marketplaceApiProvider).catalog.heroBanners(),
);

const _autoplay = Duration(seconds: 6);

/// Same fallback copy the web slider shows before any banner is published, so
/// the hero is never an empty box.
const _fallbackSlide = HeroBannerSlideFallback(
  title: "Rent Smarter. Drive Unlimited Possibilities.",
  subtitle: "Transparent daily rates, instant booking confirmation, zero hidden fees.",
);

class HeroBannerSlideFallback {
  final String title;
  final String subtitle;
  const HeroBannerSlideFallback({required this.title, required this.subtitle});
}

/// Port of HeroSlider.tsx: a full-bleed image slide with a bottom-up scrim,
/// crossfading copy, autoplay, dot indicators, and an optional CTA.
class HeroSlider extends ConsumerStatefulWidget {
  /// Invoked with a slide's `ctaUrl` when its button is tapped. Left null the
  /// CTA is hidden — mobile has no browser to fall back on.
  final void Function(String ctaUrl)? onCtaTap;
  final double height;

  const HeroSlider({super.key, this.onCtaTap, this.height = 260});

  @override
  ConsumerState<HeroSlider> createState() => _HeroSliderState();
}

class _HeroSliderState extends ConsumerState<HeroSlider> {
  int _index = 0;
  Timer? _timer;

  /// Slide count the running timer was built for. The banner feed arrives
  /// asynchronously and the admin can publish or retire slides, so the timer
  /// has to be rebuilt whenever the count changes — not just once.
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
    _timer = Timer.periodic(_autoplay, (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % count);
    });
  }

  @override
  Widget build(BuildContext context) {
    final slides = ref.watch(heroBannersProvider).valueOrNull ?? const <HeroBannerSlide>[];
    final count = slides.isEmpty ? 1 : slides.length;

    // Autoplay follows the feed: it can't start until the banners land, and it
    // rebuilds if the admin publishes or retires slides. Deferred to after the
    // frame because it may cancel a timer whose callback calls setState.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _ensureRotating(count);
    });
    if (_index >= count) _index = 0;

    final slide = slides.isEmpty ? null : slides[_index];
    final title = slide?.title ?? _fallbackSlide.title;
    final subtitle = slide?.subtitle ?? (slides.isEmpty ? _fallbackSlide.subtitle : null);
    final imageUrl = slide?.imageUrl;

    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(color: AppColors.isDark(context) ? AppColors.darkSurface : AppColors.primary900),
          if (imageUrl != null && imageUrl.isNotEmpty)
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 700),
              child: CachedNetworkImage(
                key: ValueKey(imageUrl),
                imageUrl: imageUrl,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
          // Bottom-up scrim so the copy stays legible over any artwork.
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  AppColors.primary900.withValues(alpha: 0.9),
                  AppColors.primary900.withValues(alpha: 0.4),
                  AppColors.primary900.withValues(alpha: 0.1),
                ],
              ),
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 32,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 350),
              child: Column(
                key: ValueKey(slide?.id ?? "fallback"),
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, height: 1.15, color: Colors.white),
                  ),
                  if (subtitle != null && subtitle.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 13, height: 1.5, color: Colors.white.withValues(alpha: 0.8)),
                    ),
                  ],
                  if (widget.onCtaTap != null &&
                      slide?.ctaLabel != null &&
                      slide!.ctaLabel!.isNotEmpty &&
                      slide.ctaUrl != null) ...[
                    const SizedBox(height: 16),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary900,
                      ),
                      onPressed: () => widget.onCtaTap!(slide.ctaUrl!),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(slide.ctaLabel!),
                          const SizedBox(width: 6),
                          const Icon(Icons.chevron_right, size: 18),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (count > 1)
            Positioned(
              right: 20,
              bottom: 14,
              child: Row(
                children: [
                  for (var i = 0; i < count; i++)
                    GestureDetector(
                      onTap: () => setState(() => _index = i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.only(left: 6),
                        height: 6,
                        width: i == _index ? 24 : 6,
                        decoration: BoxDecoration(
                          color: i == _index ? Colors.white : Colors.white.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(999),
                        ),
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
