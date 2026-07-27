import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _myBookingsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).bookings.mine(limit: 50));

class MyBookingsPage extends ConsumerWidget {
  const MyBookingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text("My bookings")),
        body: EmptyState(
          icon: Icons.calendar_month_outlined,
          title: "Sign in to see your bookings",
          action: ElevatedButton(onPressed: () => context.push("/login"), child: const Text("Sign in")),
        ),
      );
    }

    final bookingsAsync = ref.watch(_myBookingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("My bookings")),
      body: bookingsAsync.when(
        data: (page) => page.items.isEmpty
            ? EmptyState(
                icon: Icons.calendar_month_outlined,
                title: "No bookings yet",
                message: "Search for a vehicle to get started.",
                action: ElevatedButton(onPressed: () => context.go("/search"), child: const Text("Browse vehicles")),
              )
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_myBookingsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, i) => _BookingCard(booking: page.items[i]),
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_myBookingsProvider)),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () => context.push("/bookings/${booking.id}"),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(booking.vehicle?.model ?? "Vehicle", style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                  StatusBadge.booking(booking.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(booking.bookingNumber, style: TextStyle(color: AppColors.mutedTextOf(context), fontSize: 12)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.mutedTextOf(context)),
                  const SizedBox(width: 6),
                  Expanded(child: Text("${formatDate(booking.pickupDatetime)} → ${formatDate(booking.returnDatetime)}", style: const TextStyle(fontSize: 13))),
                ],
              ),
              const SizedBox(height: 10),
              Text(formatCurrency(booking.totalAmount), style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.secondary)),
            ],
          ),
        ),
      ),
    );
  }
}
