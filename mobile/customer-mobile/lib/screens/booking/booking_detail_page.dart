import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _bookingProvider = FutureProvider.autoDispose.family<Booking, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).bookings.byId(id),
);

const _cancellableStatuses = {
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.approved,
  BookingStatus.vehicleReady,
};

class BookingDetailPage extends ConsumerWidget {
  final String bookingId;
  const BookingDetailPage({super.key, required this.bookingId});

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Cancel booking?"),
        content: const Text("This can't be undone."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Keep booking")),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Cancel booking")),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(marketplaceApiProvider).bookings.cancel(bookingId);
      ref.invalidate(_bookingProvider(bookingId));
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(_bookingProvider(bookingId));
    return Scaffold(
      appBar: AppBar(title: const Text("Booking details")),
      body: bookingAsync.when(
        data: (booking) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(booking.vehicle?.model ?? "Vehicle", style: Theme.of(context).textTheme.titleLarge),
                  ),
                  StatusBadge.booking(booking.status),
                ],
              ),
              Text(booking.bookingNumber, style: TextStyle(color: AppColors.mutedTextOf(context))),
              const SizedBox(height: 24),
              Text("Tracking", style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              BookingStatusTimeline(currentStatus: booking.status),
              const SizedBox(height: 8),
              Text("Trip", style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _InfoRow(label: "Pickup", value: "${formatDateTime(booking.pickupDatetime)}\n${booking.pickupLocation}"),
              const SizedBox(height: 12),
              _InfoRow(label: "Return", value: "${formatDateTime(booking.returnDatetime)}\n${booking.returnLocation}"),
              const SizedBox(height: 24),
              Text("Payment", style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _InfoRow(label: "Base price", value: formatCurrency(booking.basePrice)),
              if (booking.discountAmount > 0) _InfoRow(label: "Discount", value: "− ${formatCurrency(booking.discountAmount)}"),
              _InfoRow(label: "Tax", value: formatCurrency(booking.taxAmount)),
              _InfoRow(label: "Security deposit", value: formatCurrency(booking.securityDeposit)),
              const Divider(height: 24),
              _InfoRow(label: "Total", value: formatCurrency(booking.totalAmount), emphasize: true),
              if (booking.invoice != null) ...[
                const SizedBox(height: 12),
                Text("Invoice: ${booking.invoice!.invoiceNumber}", style: TextStyle(color: AppColors.mutedTextOf(context))),
              ],
              if (booking.cancellationReason != null) ...[
                const SizedBox(height: 16),
                Text("Cancellation reason: ${booking.cancellationReason}", style: const TextStyle(color: AppColors.danger)),
              ],
              const SizedBox(height: 24),
              if (_cancellableStatuses.contains(booking.status))
                LoadingButton(label: "Cancel booking", outlined: true, onPressed: () => _cancel(context, ref)),
              const SizedBox(height: 24),
            ],
          ),
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_bookingProvider(bookingId))),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool emphasize;
  const _InfoRow({required this.label, required this.value, this.emphasize = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: TextStyle(color: AppColors.mutedTextOf(context)))),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontWeight: emphasize ? FontWeight.w800 : FontWeight.w500, fontSize: emphasize ? 18 : 14),
            ),
          ),
        ],
      ),
    );
  }
}
