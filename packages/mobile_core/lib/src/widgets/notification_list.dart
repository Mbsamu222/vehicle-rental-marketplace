import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/providers.dart';
import '../models/notification.dart';
import '../models/pagination.dart';
import '../theme/app_colors.dart';
import '../utils/formatters.dart';
import 'app_card.dart';
import 'common.dart';

/// Shared notifications screen body. Customer, partner, and admin all read the
/// same `/notifications` feed and render it identically on the web
/// (NotificationsPage.tsx is duplicated per app), so mobile builds it once.
final notificationsProvider = FutureProvider.autoDispose<Paginated<AppNotification>>(
  (ref) => ref.watch(marketplaceApiProvider).notifications.list(limit: 50),
);

class NotificationsView extends ConsumerWidget {
  final String subtitle;

  /// Called with a notification's `data` payload when tapped, so each app can
  /// deep-link into its own routes (a booking id means different screens in
  /// the customer and partner apps).
  final void Function(AppNotification notification)? onOpen;

  const NotificationsView({
    super.key,
    this.subtitle = "Stay up to date on bookings and your account.",
    this.onOpen,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final api = ref.watch(marketplaceApiProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(notificationsProvider),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // No title here — every caller already puts "Notifications" in its
          // AppBar, so repeating it as a PageHeader would stack it twice. (The
          // web pages render an h1 because their sidebar layout has no app bar.)
          Row(
            children: [
              Expanded(
                child: Text(subtitle, style: TextStyle(fontSize: 12.5, color: AppColors.mutedTextOf(context))),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () async {
                  await api.notifications.markAllRead();
                  ref.invalidate(notificationsProvider);
                },
                child: const Text("Mark all read"),
              ),
            ],
          ),
          const SizedBox(height: 12),
          notifications.when(
            data: (page) => page.items.isEmpty
                ? const Padding(
                    padding: EdgeInsets.only(top: 32),
                    child: EmptyState(icon: Icons.notifications_off_outlined, title: "You're all caught up"),
                  )
                : Column(
                    children: [
                      for (final notification in page.items) ...[
                        _NotificationCard(
                          notification: notification,
                          onTap: () async {
                            if (notification.isUnread) {
                              await api.notifications.markRead(notification.id);
                              ref.invalidate(notificationsProvider);
                            }
                            onOpen?.call(notification);
                          },
                        ),
                        const SizedBox(height: 10),
                      ],
                    ],
                  ),
            loading: () => const SectionLoading(),
            error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(notificationsProvider)),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  const _NotificationCard({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final unread = notification.isUnread;

    return Stack(
      children: [
        AppCard(padding: const EdgeInsets.all(16), onTap: onTap, child: _body(context)),
        // Unread tint drawn over the card rather than by swapping AppCard's
        // fill, so the border, radius, and shadow stay identical to every
        // other card in the app.
        if (unread)
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.secondary.withValues(alpha: 0.06)
                      : AppColors.secondary50.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.secondary.withValues(alpha: 0.3)),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _body(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textOf(context)),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    notification.message,
                    style: TextStyle(fontSize: 13, height: 1.45, color: AppColors.mutedTextOf(context)),
                  ),
                ],
              ),
            ),
            if (notification.isUnread) ...[
              const SizedBox(width: 10),
              Container(
                margin: const EdgeInsets.only(top: 5),
                width: 8,
                height: 8,
                decoration: const BoxDecoration(color: AppColors.secondary, shape: BoxShape.circle),
              ),
            ],
          ],
        ),
        const SizedBox(height: 10),
        Text(
          formatDateTime(notification.createdAt),
          style: TextStyle(fontSize: 11, color: AppColors.mutedTextOf(context)),
        ),
      ],
    );
  }
}
