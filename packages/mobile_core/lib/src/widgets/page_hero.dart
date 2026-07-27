import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'gradient_mesh.dart';
import 'marketing.dart';

/// Port of apps/public-site's PageHero.tsx — the dark header band every public
/// content page opens with (about, contact, FAQ, blog, cities, categories,
/// legal).
///
/// The web layers a [GradientMesh] (blue + teal blurred blobs) and a centred
/// secondary glow over the primary fill. That blue-to-teal wash is the
/// distinctive part of the design, so it is reproduced rather than approximated
/// with a single radial tint.
class PageHero extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String? description;
  final Widget? child;

  const PageHero({
    super.key,
    required this.eyebrow,
    required this.title,
    this.description,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final base = AppColors.isDark(context) ? AppColors.darkSurface : AppColors.primary900;

    return Container(
      width: double.infinity,
      color: base,
      child: Stack(
        children: [
          const Positioned.fill(child: GradientMesh()),
          // The extra centred top glow the web adds alongside the mesh
          // (`size-96 -translate-x-1/2 rounded-full bg-secondary/15 blur-3xl`).
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(0, -1.0),
                    radius: 1.0,
                    colors: [AppColors.secondary.withValues(alpha: 0.15), AppColors.secondary.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 36, 24, 40),
            child: Column(
              children: [
                Eyebrow(text: eyebrow, centered: true, tone: EyebrowTone.light),
                const SizedBox(height: 16),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    height: 1.12,
                    letterSpacing: -0.5,
                    color: Colors.white,
                  ),
                ),
                if (description != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    description!,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, height: 1.6, color: Colors.white.withValues(alpha: 0.75)),
                  ),
                ],
                if (child != null) ...[const SizedBox(height: 20), child!],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Scaffold wrapper for the public content pages: a dark [PageHero] under a
/// transparent back-navigable app bar, then scrolling body content. Keeps the
/// hero flush with the status bar the way the web hero sits flush under the
/// site header.
class HeroScaffold extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String? description;
  final List<Widget> slivers;
  final Widget? heroChild;
  final List<Widget>? actions;

  const HeroScaffold({
    super.key,
    required this.eyebrow,
    required this.title,
    this.description,
    required this.slivers,
    this.heroChild,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        actions: actions,
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: PageHero(eyebrow: eyebrow, title: title, description: description, child: heroChild),
          ),
          ...slivers,
        ],
      ),
    );
  }
}
