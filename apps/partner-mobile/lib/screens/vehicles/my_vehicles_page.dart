import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _myVehiclesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).vehicles.myVehicles(limit: 50));

class MyVehiclesPage extends ConsumerWidget {
  const MyVehiclesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiclesAsync = ref.watch(_myVehiclesProvider);
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: DashboardTopBar(
        title: "My Vehicles",
        userName: user?.fullName,
        onSettings: () => context.push("/profile"),
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push("/vehicles/new"),
        icon: const Icon(Icons.add),
        label: const Text("Add vehicle"),
      ),
      body: vehiclesAsync.when(
        data: (page) => page.items.isEmpty
            ? const EmptyState(icon: Icons.directions_car_outlined, title: "No vehicles yet", message: "Add your first vehicle to start receiving bookings.")
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_myVehiclesProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, i) => _VehicleRow(vehicle: page.items[i]),
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_myVehiclesProvider)),
      ),
    );
  }
}

class _VehicleRow extends ConsumerWidget {
  final Vehicle vehicle;
  const _VehicleRow({required this.vehicle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SizedBox(
                width: 100,
                height: 80,
                child: vehicle.primaryImageUrl != null
                    ? CachedNetworkImage(imageUrl: vehicle.primaryImageUrl!, fit: BoxFit.cover)
                    : Container(color: AppColors.primary100, child: const Icon(Icons.directions_car)),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(vehicle.model, style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text("${vehicle.registrationNumber} · ${formatCurrency(vehicle.pricePerDay)}/day", style: const TextStyle(fontSize: 12, color: AppColors.primary400)),
                      const SizedBox(height: 6),
                      StatusBadge.approval(vehicle.approvalStatus),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (vehicle.rejectionReason != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Text("Rejected: ${vehicle.rejectionReason}", style: const TextStyle(color: AppColors.danger, fontSize: 12)),
            ),
          const Divider(height: 1),
          Row(
            children: [
              Expanded(
                child: TextButton.icon(
                  onPressed: () => context.push("/vehicles/${vehicle.id}/images"),
                  icon: const Icon(Icons.photo_library_outlined, size: 18),
                  label: const Text("Images"),
                ),
              ),
              Expanded(
                child: TextButton.icon(
                  onPressed: () => context.push("/vehicles/${vehicle.id}/edit"),
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text("Edit"),
                ),
              ),
              Expanded(
                child: TextButton.icon(
                  onPressed: vehicle.isActive
                      ? () async {
                          await ref.read(marketplaceApiProvider).vehicles.deactivate(vehicle.id);
                          ref.invalidate(_myVehiclesProvider);
                        }
                      : null,
                  icon: const Icon(Icons.visibility_off_outlined, size: 18),
                  label: Text(vehicle.isActive ? "Deactivate" : "Inactive"),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
