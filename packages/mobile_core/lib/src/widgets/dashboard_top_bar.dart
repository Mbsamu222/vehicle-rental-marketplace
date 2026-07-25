import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Top bar for the partner/admin dashboard shells, matching packages/ui's
/// DashboardShell.tsx header: title on the left, a notification bell with an
/// unread badge, and an avatar that opens a Settings/Log out menu — the
/// header chrome web users see on every screen but mobile was missing
/// (mobile only had a bottom tab bar).
class DashboardTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? userName;
  final int notificationCount;
  final VoidCallback? onNotifications;
  final VoidCallback? onSettings;
  final VoidCallback onLogout;
  final VoidCallback? onToggleTheme;
  final Widget? leadingAction;
  final List<Widget> extraActions;

  const DashboardTopBar({
    super.key,
    required this.title,
    this.userName,
    this.notificationCount = 0,
    this.onNotifications,
    this.onSettings,
    this.onToggleTheme,
    required this.onLogout,
    this.leadingAction,
    this.extraActions = const [],
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  String get _initials {
    final name = (userName ?? "").trim();
    if (name.isEmpty) return "?";
    return name.split(RegExp(r"\s+")).take(2).map((s) => s[0].toUpperCase()).join();
  }

  @override
  Widget build(BuildContext context) {
    final muted = AppColors.mutedTextOf(context);
    final isDark = AppColors.isDark(context);
    return AppBar(
      backgroundColor: AppColors.surfaceOf(context),
      elevation: 0,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      automaticallyImplyLeading: false,
      titleSpacing: 20,
      leadingWidth: leadingAction != null ? 56 : 0,
      leading: leadingAction,
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: AppColors.textOf(context))),
      actions: [
        ...extraActions,
        if (onToggleTheme != null)
          IconButton(
            icon: Icon(isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round_outlined, color: muted, size: 20),
            tooltip: isDark ? "Switch to light mode" : "Switch to dark mode",
            onPressed: onToggleTheme,
          ),
        if (onNotifications != null)
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.notifications_outlined, color: muted),
                onPressed: onNotifications,
              ),
              if (notificationCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle),
                    child: Text(
                      notificationCount > 9 ? "9+" : "$notificationCount",
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700, height: 1.2),
                    ),
                  ),
                ),
            ],
          ),
        PopupMenuButton<String>(
          tooltip: "Account",
          onSelected: (value) {
            if (value == "settings") onSettings?.call();
            if (value == "logout") onLogout();
          },
          itemBuilder: (context) => [
            if (onSettings != null)
              PopupMenuItem(
                value: "settings",
                child: Row(children: [
                  Icon(Icons.settings_outlined, size: 17, color: AppColors.mutedTextOf(context)),
                  const SizedBox(width: 10),
                  const Text("Settings"),
                ]),
              ),
            const PopupMenuItem(
              value: "logout",
              child: Row(children: [
                Icon(Icons.logout, size: 17, color: AppColors.danger),
                SizedBox(width: 10),
                Text("Log out", style: TextStyle(color: AppColors.danger)),
              ]),
            ),
          ],
          child: Padding(
            padding: const EdgeInsets.only(right: 20, left: 4),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.secondary100,
              child: Text(_initials, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.secondaryHover)),
            ),
          ),
        ),
      ],
    );
  }
}
