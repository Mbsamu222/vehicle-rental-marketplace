import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The labelled horizontal bar used by the partner analytics and admin
/// monetization screens — a port of the local `Bar` component in
/// apps/partner-web/src/screens/analytics/FleetAnalyticsPage.tsx, including its
/// 4% minimum width so a non-zero value is never invisible.
class StatBar extends StatelessWidget {
  final String label;
  final double value;
  final double maxValue;
  final String valueLabel;

  const StatBar({
    super.key,
    required this.label,
    required this.value,
    required this.maxValue,
    required this.valueLabel,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final fraction = maxValue > 0 ? (value / maxValue).clamp(0.04, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: AppColors.textOf(context)),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              valueLabel,
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.mutedTextOf(context)),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: fraction.toDouble(),
            minHeight: 8,
            backgroundColor: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.primary50,
            valueColor: AlwaysStoppedAnimation(isDark ? AppColors.accentTextDark : AppColors.secondary),
          ),
        ),
      ],
    );
  }
}
