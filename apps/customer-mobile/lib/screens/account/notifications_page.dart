import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _notificationsProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).notifications.list(limit: 50));

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(_notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notifications"),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(marketplaceApiProvider).notifications.markAllRead();
              ref.invalidate(_notificationsProvider);
            },
            child: const Text("Mark all read"),
          ),
        ],
      ),
      body: notificationsAsync.when(
        data: (page) => page.items.isEmpty
            ? const EmptyState(icon: Icons.notifications_none, title: "No notifications yet")
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_notificationsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 4),
                  itemBuilder: (context, i) {
                    final n = page.items[i];
                    return Card(
                      color: n.isUnread ? AppColors.secondary50 : null,
                      child: ListTile(
                        title: Text(n.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(n.message),
                        trailing: Text(formatDate(n.createdAt), style: const TextStyle(fontSize: 11, color: AppColors.primary400)),
                        onTap: n.isUnread
                            ? () async {
                                await ref.read(marketplaceApiProvider).notifications.markRead(n.id);
                                ref.invalidate(_notificationsProvider);
                              }
                            : null,
                      ),
                    );
                  },
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_notificationsProvider)),
      ),
    );
  }
}
