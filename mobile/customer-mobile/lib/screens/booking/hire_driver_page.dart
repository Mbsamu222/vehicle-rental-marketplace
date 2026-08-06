import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Picks a chauffeur for an existing booking.
///
/// Reached from the booking detail screen rather than checkout, because a
/// driver is priced from the confirmed pickup/return window — quoting before
/// those are locked in would mean re-quoting after every date change.
final _bookingProvider = FutureProvider.autoDispose.family<Booking, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).bookings.byId(id),
);

final _availableDriversProvider = FutureProvider.autoDispose.family<List<Driver>, Booking>(
  (ref, booking) => ref.watch(marketplaceApiProvider).drivers.available(
        cityId: booking.vehicle?.cityId ?? "",
        pickup: booking.pickupDatetime,
        returnAt: booking.returnDatetime,
      ),
);

class HireDriverPage extends ConsumerWidget {
  final String bookingId;
  const HireDriverPage({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(_bookingProvider(bookingId));

    return Scaffold(
      appBar: AppBar(title: const Text("Hire a driver")),
      body: booking.when(
        data: (b) => _DriverList(booking: b),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_bookingProvider(bookingId))),
      ),
    );
  }
}

class _DriverList extends ConsumerWidget {
  final Booking booking;
  const _DriverList({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (booking.withDriver) {
      return const EmptyState(
        icon: Icons.person_pin_circle_outlined,
        title: "Driver already added",
        message: "This booking is chauffeur-driven. Contact support to change the assigned driver.",
      );
    }

    final drivers = ref.watch(_availableDriversProvider(booking));

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_availableDriversProvider(booking)),
      child: drivers.when(
        data: (list) => list.isEmpty
            ? const EmptyState(
                icon: Icons.person_off_outlined,
                title: "No drivers free for these dates",
                message:
                    "Every verified driver in this city is already booked for your window. Try adjusting your times.",
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    "Verified drivers available for your exact pickup and return times. The quoted amount is added to this booking's total.",
                    style: TextStyle(fontSize: 12.5, height: 1.55, color: AppColors.mutedTextOf(context)),
                  ),
                  const SizedBox(height: 16),
                  for (final driver in list) ...[
                    _DriverCard(
                      driver: driver,
                      onHire: () => _hire(context, ref, driver),
                    ),
                    const SizedBox(height: 12),
                  ],
                ],
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(
          message: "$e",
          onRetry: () => ref.invalidate(_availableDriversProvider(booking)),
        ),
      ),
    );
  }

  Future<void> _hire(BuildContext context, WidgetRef ref, Driver driver) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Hire ${driver.displayName}?"),
        content: Text(
          "${formatCurrency(driver.quotedAmount ?? driver.dailyRate, precise: true)} will be added to this booking. "
          "The driver still has to accept before it's confirmed.",
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Request")),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(marketplaceApiProvider).drivers.hire(booking.id, driver.id);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Driver requested — you'll be notified when they confirm.")),
      );
      context.pop();
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _DriverCard extends StatelessWidget {
  final Driver driver;
  final VoidCallback onHire;
  const _DriverCard({required this.driver, required this.onHire});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InitialsAvatar(name: driver.displayName, size: 46),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      driver.displayName,
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "${driver.yearsOfExperience} yrs experience · ${driver.totalTrips} trips",
                      style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                    ),
                    if (driver.totalReviews > 0) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          StarRatingDisplay(rating: driver.averageRating, size: 13),
                          const SizedBox(width: 5),
                          Text(
                            "${driver.averageRating.toStringAsFixed(1)} (${driver.totalReviews})",
                            style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatCurrency(driver.quotedAmount ?? driver.dailyRate, precise: true),
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
                  ),
                  Text(
                    "for this trip",
                    style: TextStyle(fontSize: 10.5, color: AppColors.mutedTextOf(context)),
                  ),
                ],
              ),
            ],
          ),
          if (driver.languages != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.translate, size: 13, color: AppColors.mutedTextOf(context)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    driver.languages!,
                    style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                  ),
                ),
              ],
            ),
          ],
          if (driver.bio != null) ...[
            const SizedBox(height: 8),
            Text(
              driver.bio!,
              style: TextStyle(fontSize: 12.5, height: 1.5, color: AppColors.mutedTextOf(context)),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(onPressed: onHire, child: const Text("Hire this driver")),
          ),
        ],
      ),
    );
  }
}
