import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _ticketsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).support.list(limit: 50));

class SupportTicketsPage extends ConsumerWidget {
  const SupportTicketsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(_ticketsProvider);
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: DashboardTopBar(
        title: "Support Tickets",
        userName: user?.fullName,
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: ticketsAsync.when(
        data: (page) => page.items.isEmpty
            ? const EmptyState(icon: Icons.support_agent_outlined, title: "No support tickets")
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_ticketsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final ticket = page.items[i];
                    return AppCard(
                      padding: EdgeInsets.zero,
                      onTap: () => context.push("/support/${ticket.id}"),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        title: Text(ticket.subject, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text("${ticket.user?.fullName ?? 'User'} · ${formatDate(ticket.createdAt)}"),
                        trailing: StatusBadge.support(ticket.status),
                      ),
                    );
                  },
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_ticketsProvider)),
      ),
    );
  }
}
