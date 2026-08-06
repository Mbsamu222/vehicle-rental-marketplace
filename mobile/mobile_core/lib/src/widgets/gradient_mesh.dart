import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Port of packages/ui GradientMesh.tsx — three oversized, heavily blurred
/// colour blobs behind hero and CTA sections. This is what gives the web heroes
/// their blue-to-teal wash; a flat fill or a single radial glow does not read
/// the same.
///
/// The web uses `blur-3xl` (64px) on solid-fill circles. Reproducing that with
/// a real blur filter would cost a saveLayer on every frame, so each blob is
/// drawn as a RadialGradient fading to transparent, which is visually
/// equivalent at this blur radius and effectively free.
///
/// Blob geometry and opacities are taken directly from the web component:
///   1. -left-24 -top-32   size-[28rem]  bg-secondary/40
///   2. -right-24 top-1/3  size-[24rem]  bg-accent/30
///   3. bottom-[-8rem] left-1/3 size-[22rem] bg-secondary/20
class GradientMesh extends StatelessWidget {
  /// `dark` is the variant used over the primary/dark-surface heroes; `light`
  /// is the muted version the web uses over light sections.
  final bool dark;

  const GradientMesh({super.key, this.dark = true});

  @override
  Widget build(BuildContext context) {
    // Tailwind rem sizes at the web's 16px root: 28rem/24rem/22rem. Scaled to
    // the viewport width so the composition reads the same on a phone as it
    // does in a desktop hero rather than being cropped to one corner.
    final width = MediaQuery.sizeOf(context).width;
    final unit = width / 24; // ~16px at 384dp, matching the web's rem scale

    return IgnorePointer(
      child: ClipRect(
        child: Stack(
          children: [
            _Blob(
              left: -6 * unit,
              top: -8 * unit,
              size: 28 * unit,
              color: AppColors.secondary.withValues(alpha: dark ? 0.40 : 0.15),
            ),
            Positioned.fill(
              child: LayoutBuilder(
                builder: (context, constraints) => Stack(
                  children: [
                    _Blob(
                      right: -6 * unit,
                      top: constraints.maxHeight / 3,
                      size: 24 * unit,
                      color: AppColors.accent.withValues(alpha: dark ? 0.30 : 0.15),
                    ),
                    _Blob(
                      left: constraints.maxWidth / 3,
                      bottom: -8 * unit,
                      size: 22 * unit,
                      color: AppColors.secondary.withValues(alpha: dark ? 0.20 : 0.10),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double? left;
  final double? right;
  final double? top;
  final double? bottom;
  final double size;
  final Color color;

  const _Blob({
    this.left,
    this.right,
    this.top,
    this.bottom,
    required this.size,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: left,
      right: right,
      top: top,
      bottom: bottom,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color, color.withValues(alpha: 0)],
            stops: const [0.0, 1.0],
          ),
        ),
      ),
    );
  }
}
