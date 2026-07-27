import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _pendingVehiclesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).vehicles.pendingApproval(limit: 50));

class VehicleApprovalsPage extends ConsumerWidget {
  const VehicleApprovalsPage({super.key});

  Future<void> _review(BuildContext context, WidgetRef ref, Vehicle vehicle, String status) async {
    String? rejectionReason;
    if (status == "REJECTED") {
      rejectionReason = await showDialog<String>(
        context: context,
        builder: (context) {
          final controller = TextEditingController();
          return AlertDialog(
            title: const Text("Rejection reason"),
            content: TextField(controller: controller, decoration: const InputDecoration(hintText: "Explain why")),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
              TextButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text("Reject")),
            ],
          );
        },
      );
      if (rejectionReason == null) return;
    }
    try {
      await ref.read(marketplaceApiProvider).vehicles.review(vehicle.id, status: status, rejectionReason: rejectionReason);
      ref.invalidate(_pendingVehiclesProvider);
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(_pendingVehiclesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Vehicle approvals")),
      body: pendingAsync.when(
        data: (page) => page.items.isEmpty
            ? const EmptyState(icon: Icons.check_circle_outline, title: "All caught up", message: "No vehicles awaiting approval.")
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_pendingVehiclesProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final vehicle = page.items[i];
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
                                    : Container(
                                        color: AppColors.subtleFillOf(context),
                                        child: Icon(Icons.directions_car, color: AppColors.mutedTextOf(context)),
                                      ),
                              ),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(vehicle.model, style: const TextStyle(fontWeight: FontWeight.w700)),
                                      Text(vehicle.rentalPartner?.businessName ?? "", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                                      Text("${vehicle.registrationNumber} · ${formatCurrency(vehicle.pricePerDay)}/day", style: const TextStyle(fontSize: 12)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 1),
                          Row(
                            children: [
                              Expanded(
                                child: TextButton.icon(
                                  onPressed: () => _review(context, ref, vehicle, "APPROVED"),
                                  icon: const Icon(Icons.check, color: AppColors.success),
                                  label: const Text("Approve", style: TextStyle(color: AppColors.success)),
                                ),
                              ),
                              Expanded(
                                child: TextButton.icon(
                                  onPressed: () => _review(context, ref, vehicle, "REJECTED"),
                                  icon: const Icon(Icons.close, color: AppColors.danger),
                                  label: const Text("Reject", style: TextStyle(color: AppColors.danger)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_pendingVehiclesProvider)),
      ),
    );
  }
}
