import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _statusFilterProvider = StateProvider.autoDispose<String?>((ref) => null);
final _partnerBookingsProvider = FutureProvider.autoDispose((ref) {
  final status = ref.watch(_statusFilterProvider);
  return ref.watch(marketplaceApiProvider).bookings.partnerMine(status: status, limit: 50);
});

const _filters = [
  (null, "All"),
  ("PENDING", "Pending"),
  ("CONFIRMED", "Confirmed"),
  ("APPROVED", "Approved"),
  ("VEHICLE_READY", "Vehicle ready"),
  ("PICKED_UP", "Picked up"),
  ("ACTIVE", "Active"),
  ("RETURNING", "Returning"),
  ("COMPLETED", "Completed"),
  ("REJECTED", "Rejected"),
  ("CANCELLED", "Cancelled"),
];

class PartnerBookingsPage extends ConsumerWidget {
  const PartnerBookingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(_statusFilterProvider);
    final bookingsAsync = ref.watch(_partnerBookingsProvider);
    final user = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: DashboardTopBar(
        title: "Booking Requests",
        userName: user?.fullName,
        onSettings: () => context.push("/profile"),
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: _filters.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final (value, label) = _filters[i];
                return ChoiceChip(
                  label: Text(label),
                  selected: selected == value,
                  onSelected: (_) => ref.read(_statusFilterProvider.notifier).state = value,
                );
              },
            ),
          ),
          Expanded(
            child: bookingsAsync.when(
              data: (page) => page.items.isEmpty
                  ? const EmptyState(icon: Icons.calendar_month_outlined, title: "No bookings here")
                  : RefreshIndicator(
                      onRefresh: () async => ref.invalidate(_partnerBookingsProvider),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: page.items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, i) {
                          final booking = page.items[i];
                          return Card(
                            child: ListTile(
                              onTap: () => context.push("/bookings/${booking.id}"),
                              title: Text(booking.vehicle?.model ?? "Vehicle", style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text("${booking.customer?.fullName ?? ''}\n${formatDate(booking.pickupDatetime)} → ${formatDate(booking.returnDatetime)}"),
                              isThreeLine: true,
                              trailing: StatusBadge.booking(booking.status),
                            ),
                          );
                        },
                      ),
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_partnerBookingsProvider)),
            ),
          ),
        ],
      ),
    );
  }
}
