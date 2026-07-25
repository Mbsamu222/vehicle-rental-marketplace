import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _vehicleProvider = FutureProvider.autoDispose.family<Vehicle, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).vehicles.byId(id),
);

final _wishlistProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).users.wishlist());

class VehicleDetailPage extends ConsumerStatefulWidget {
  final String vehicleId;
  const VehicleDetailPage({super.key, required this.vehicleId});

  @override
  ConsumerState<VehicleDetailPage> createState() => _VehicleDetailPageState();
}

class _VehicleDetailPageState extends ConsumerState<VehicleDetailPage> {
  DateTime? _pickup;
  DateTime? _return;

  Future<void> _pickDateTime({required bool isPickup}) async {
    final now = DateTime.now();
    final initial = (isPickup ? _pickup : _return) ?? now.add(Duration(hours: isPickup ? 2 : 26));
    final date = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 180)),
      initialDate: initial.isBefore(now) ? now : initial,
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial));
    if (time == null) return;
    final combined = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() {
      if (isPickup) {
        _pickup = combined;
        if (_return != null && !_return!.isAfter(combined)) _return = combined.add(const Duration(hours: 24));
      } else {
        _return = combined;
      }
    });
  }

  void _continueToCheckout() {
    final auth = ref.read(authControllerProvider);
    if (!auth.isAuthenticated) {
      context.push("/login?redirect=${Uri.encodeComponent("/vehicle/${widget.vehicleId}")}");
      return;
    }
    if (_pickup == null || _return == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Choose pickup and return date/time first")));
      return;
    }
    context.push(
      "/checkout/${widget.vehicleId}?pickup=${Uri.encodeComponent(_pickup!.toUtc().toIso8601String())}&ret=${Uri.encodeComponent(_return!.toUtc().toIso8601String())}",
    );
  }

  @override
  Widget build(BuildContext context) {
    final vehicleAsync = ref.watch(_vehicleProvider(widget.vehicleId));

    return Scaffold(
      body: vehicleAsync.when(
        data: (vehicle) => _buildBody(context, vehicle),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_vehicleProvider(widget.vehicleId))),
      ),
      bottomNavigationBar: vehicleAsync.maybeWhen(
        data: (vehicle) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Text("${formatCurrency(vehicle.pricePerDay)}/day",
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.secondary)),
                ),
                ElevatedButton(onPressed: _continueToCheckout, child: const Text("Book now")),
              ],
            ),
          ),
        ),
        orElse: () => null,
      ),
    );
  }

  Widget _buildBody(BuildContext context, Vehicle vehicle) {
    final wishlist = ref.watch(_wishlistProvider);
    final isWishlisted = wishlist.maybeWhen(
      data: (items) => items.any((e) => e.vehicleId == vehicle.id),
      orElse: () => false,
    );

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 240,
          pinned: true,
          actions: [
            IconButton(
              icon: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border, color: isWishlisted ? AppColors.danger : null),
              onPressed: () async {
                final auth = ref.read(authControllerProvider);
                if (!auth.isAuthenticated) {
                  context.push("/login");
                  return;
                }
                final api = ref.read(marketplaceApiProvider).users;
                if (isWishlisted) {
                  await api.removeFromWishlist(vehicle.id);
                } else {
                  await api.addToWishlist(vehicle.id);
                }
                ref.invalidate(_wishlistProvider);
              },
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: vehicle.images.isNotEmpty
                ? PageView(
                    children: [
                      for (final image in vehicle.images) CachedNetworkImage(imageUrl: image.url, fit: BoxFit.cover),
                    ],
                  )
                : Container(color: AppColors.primary100, child: const Icon(Icons.directions_car, size: 64)),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(vehicle.model, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text("${vehicle.brand?.name ?? ''} · ${vehicle.year}", style: const TextStyle(color: AppColors.primary400)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    StarRatingDisplay(rating: vehicle.averageRating),
                    const SizedBox(width: 8),
                    Text("${vehicle.averageRating.toStringAsFixed(1)} (${vehicle.totalReviews} reviews)"),
                  ],
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _SpecChip(icon: Icons.event_seat, label: "${vehicle.seatingCapacity} seats"),
                    _SpecChip(icon: Icons.settings, label: vehicle.transmission.label),
                    _SpecChip(icon: Icons.local_gas_station, label: vehicle.fuelType.label),
                    if (vehicle.city != null) _SpecChip(icon: Icons.location_on, label: vehicle.city!.name),
                  ],
                ),
                const SizedBox(height: 24),
                Text("Trip details", style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                _DateTimeTile(label: "Pickup", value: _pickup, onTap: () => _pickDateTime(isPickup: true)),
                const SizedBox(height: 8),
                _DateTimeTile(label: "Return", value: _return, onTap: () => _pickDateTime(isPickup: false)),
                const SizedBox(height: 24),
                if (vehicle.rentalPolicies != null) ...[
                  Text("Rental policies", style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(vehicle.rentalPolicies!, style: const TextStyle(color: AppColors.primary500)),
                  const SizedBox(height: 24),
                ],
                if (vehicle.insuranceDetails != null) ...[
                  Text("Insurance", style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(vehicle.insuranceDetails!, style: const TextStyle(color: AppColors.primary500)),
                  const SizedBox(height: 24),
                ],
                Row(
                  children: [
                    Expanded(child: Text("Reviews", style: Theme.of(context).textTheme.titleMedium)),
                  ],
                ),
                const SizedBox(height: 12),
                if (vehicle.reviews.isEmpty)
                  const Text("No reviews yet.", style: TextStyle(color: AppColors.primary400))
                else
                  for (final review in vehicle.reviews) _ReviewTile(review: review),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SpecChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SpecChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: AppColors.primary50, borderRadius: BorderRadius.circular(10)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primary500),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _DateTimeTile extends StatelessWidget {
  final String label;
  final DateTime? value;
  final VoidCallback onTap;
  const _DateTimeTile({required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(14)),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.secondary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 12, color: AppColors.primary400)),
                  Text(value != null ? formatDateTime(value!) : "Select date & time", style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final Review review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(review.customer?.fullName ?? "Customer", style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(width: 8),
              StarRatingDisplay(rating: review.vehicleRating.toDouble(), size: 13),
            ],
          ),
          if (review.comment != null) ...[
            const SizedBox(height: 4),
            Text(review.comment!),
          ],
        ],
      ),
    );
  }
}
