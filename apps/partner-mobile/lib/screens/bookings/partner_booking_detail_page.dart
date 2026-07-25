import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _bookingProvider = FutureProvider.autoDispose.family<Booking, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).bookings.byId(id),
);

const Map<BookingStatus, List<(String, String)>> _partnerActions = {
  BookingStatus.confirmed: [("APPROVED", "Approve booking"), ("REJECTED", "Reject booking")],
  BookingStatus.approved: [("VEHICLE_READY", "Mark vehicle ready")],
  BookingStatus.vehicleReady: [("PICKED_UP", "Mark picked up")],
  BookingStatus.pickedUp: [("ACTIVE", "Mark rental active")],
  BookingStatus.active: [("RETURNING", "Mark returning")],
  BookingStatus.returning: [("COMPLETED", "Mark completed")],
};

class PartnerBookingDetailPage extends ConsumerWidget {
  final String bookingId;
  const PartnerBookingDetailPage({super.key, required this.bookingId});

  Future<void> _updateStatus(BuildContext context, WidgetRef ref, String status) async {
    String? note;
    if (status == "REJECTED") {
      note = await showDialog<String>(
        context: context,
        builder: (context) {
          final controller = TextEditingController();
          return AlertDialog(
            title: const Text("Reason for rejection"),
            content: TextField(controller: controller, decoration: const InputDecoration(hintText: "Optional note")),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
              TextButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text("Reject")),
            ],
          );
        },
      );
      if (note == null) return;
    }
    try {
      await ref.read(marketplaceApiProvider).bookings.updateStatus(bookingId, status: status, note: note?.isEmpty == true ? null : note);
      ref.invalidate(_bookingProvider(bookingId));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(_bookingProvider(bookingId));
    return Scaffold(
      appBar: AppBar(title: const Text("Booking details")),
      body: bookingAsync.when(
        data: (booking) {
          final actions = _partnerActions[booking.status] ?? const [];
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(booking.vehicle?.model ?? "Vehicle", style: Theme.of(context).textTheme.titleLarge)),
                    StatusBadge.booking(booking.status),
                  ],
                ),
                Text(booking.bookingNumber, style: const TextStyle(color: AppColors.primary400)),
                const SizedBox(height: 20),
                Text("Customer", style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(booking.customer?.fullName ?? "—"),
                Text(booking.customer?.phone ?? booking.customer?.email ?? "", style: const TextStyle(color: AppColors.primary400)),
                const SizedBox(height: 20),
                Text("Trip", style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text("Pickup: ${formatDateTime(booking.pickupDatetime)}\n${booking.pickupLocation}"),
                const SizedBox(height: 8),
                Text("Return: ${formatDateTime(booking.returnDatetime)}\n${booking.returnLocation}"),
                const SizedBox(height: 20),
                Text("Payment", style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text("Total: ${formatCurrency(booking.totalAmount)}", style: const TextStyle(fontWeight: FontWeight.w700)),
                if (booking.cancellationReason != null) ...[
                  const SizedBox(height: 16),
                  Text("Cancellation: ${booking.cancellationReason}", style: const TextStyle(color: AppColors.danger)),
                ],
                const SizedBox(height: 24),
                for (final (status, label) in actions) ...[
                  LoadingButton(label: label, onPressed: () => _updateStatus(context, ref, status)),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          );
        },
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_bookingProvider(bookingId))),
      ),
    );
  }
}
