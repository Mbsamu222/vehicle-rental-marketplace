import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';

enum StatCardTone { primary, secondary, accent, success, warning, danger }

/// Shared StatCard matching packages/ui's StatCard.tsx:
/// 20px rounded corners, 1px border, soft shadow, tone-colored 44x44 icon container,
/// uppercase tracking label, bold Sora display value, and optional subtitle/trend.
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final StatCardTone tone;
  final String? subtitle;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.tone = StatCardTone.secondary,
    this.subtitle,
    this.onTap,
  });

  (Color bg, Color fg) _toneColors(BuildContext context) {
    final dark = AppColors.isDark(context);
    return switch (tone) {
      StatCardTone.primary => dark ? (AppColors.neutralBgDark, AppColors.neutralTextDark) : (AppColors.primary50, AppColors.primary900),
      StatCardTone.secondary => dark ? (AppColors.infoBgDark, AppColors.infoTextDark) : (AppColors.secondary50, AppColors.secondary),
      StatCardTone.accent => dark ? (AppColors.accentBgDark, AppColors.accentTextDark) : (AppColors.accent100, AppColors.accent600),
      StatCardTone.success => dark ? (AppColors.successBgDark, AppColors.successTextDark) : (AppColors.successBg, AppColors.successText),
      StatCardTone.warning => dark ? (AppColors.warningBgDark, AppColors.warningTextDark) : (AppColors.warningBg, AppColors.warningText),
      StatCardTone.danger => dark ? (AppColors.dangerBgDark, AppColors.dangerTextDark) : (AppColors.dangerBg, AppColors.dangerText),
    };
  }

  @override
  Widget build(BuildContext context) {
    final (iconBg, iconFg) = _toneColors(context);
    final textColor = AppColors.textOf(context);
    final mutedColor = AppColors.mutedTextOf(context);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceOf(context),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderOf(context).withValues(alpha: 0.8)),
        boxShadow: AppShadows.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        label.toUpperCase(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: mutedColor,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: iconBg,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Icon(icon, color: iconFg, size: 22),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: textColor,
                        height: 1.1,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: tone == StatCardTone.warning ? AppColors.warningText : mutedColor,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
