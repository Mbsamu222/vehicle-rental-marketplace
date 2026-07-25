import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The bold-title + muted-subtitle (+ optional trailing action) header row
/// every web screen opens with (e.g. DashboardPage.tsx, UsersPage.tsx). Use
/// this instead of burying the page title inside a plain `AppBar` so mobile
/// keeps the same two-tier heading hierarchy as web.
class PageHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? action;

  const PageHeader({super.key, required this.title, this.subtitle, this.action});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900, fontSize: 20),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: TextStyle(fontSize: 12.5, color: AppColors.mutedTextOf(context), fontWeight: FontWeight.w500),
                ),
              ],
            ],
          ),
        ),
        if (action != null) ...[const SizedBox(width: 12), action!],
      ],
    );
  }
}
