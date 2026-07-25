import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';

/// Shared card surface matching packages/ui's Card.tsx: 20px rounded corners,
/// 1px border, `shadow-soft`, and an optional `glass` (translucent/blurred)
/// variant. Every "boxed section" on mobile should use this instead of a
/// hand-rolled `Container(decoration: BoxDecoration(...))` so cards read the
/// same across screens and against the web app.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool glass;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.onTap,
    this.glass = false,
  });

  @override
  Widget build(BuildContext context) {
    final surface = AppColors.surfaceOf(context);
    return Container(
      decoration: BoxDecoration(
        color: glass ? surface.withValues(alpha: 0.7) : surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderOf(context).withValues(alpha: 0.8)),
        boxShadow: glass ? AppShadows.glass : AppShadows.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

/// Mirrors packages/ui's CardHeader.tsx: a bottom-bordered row with a bold
/// title, optional subtitle, and optional trailing action — used as the top
/// slice of an [AppCard] built with `padding: EdgeInsets.zero`.
class AppCardHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const AppCardHeader({super.key, required this.title, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderOf(context)))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textOf(context))),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                ],
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}
