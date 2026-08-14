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
    final border = AppColors.borderOf(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push("/vehicles/${vehicle.id}"),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: SizedBox(
                      width: 88,
                      height: 88,
                      child: vehicle.primaryImageUrl != null
                          ? CachedNetworkImage(imageUrl: vehicle.primaryImageUrl!, fit: BoxFit.cover)
                          : Container(
                              color: AppColors.subtleFillOf(context),
                              child: Icon(Icons.directions_car, color: AppColors.mutedTextOf(context)),
                            ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                vehicle.model,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                              ),
                            ),
                            const SizedBox(width: 8),
                            StatusBadge.approval(vehicle.approvalStatus),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.confirmation_number_outlined, size: 13, color: AppColors.mutedTextOf(context)),
                            const SizedBox(width: 4),
                            Text(vehicle.registrationNumber, style: TextStyle(fontSize: 12.5, color: AppColors.mutedTextOf(context))),
                          ],
                        ),
                        const SizedBox(height: 6),
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: formatCurrency(vehicle.pricePerDay),
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textOf(context)),
                              ),
                              TextSpan(
                                text: " / day",
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (vehicle.rejectionReason != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.isDark(context) ? AppColors.dangerBgDark : AppColors.dangerBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.error_outline, size: 15, color: AppColors.isDark(context) ? AppColors.dangerTextDark : AppColors.dangerText),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          vehicle.rejectionReason!,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.isDark(context) ? AppColors.dangerTextDark : AppColors.dangerText,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            Divider(height: 1, color: border),
            SizedBox(
              height: 46,
              child: Row(
                children: [
                  Expanded(
                    child: _RowAction(
                      icon: Icons.photo_library_outlined,
                      label: "Images",
                      onTap: () => context.push("/vehicles/${vehicle.id}/images"),
                    ),
                  ),
                  VerticalDivider(width: 1, thickness: 1, color: border, indent: 10, endIndent: 10),
                  Expanded(
                    child: _RowAction(
                      icon: Icons.edit_outlined,
                      label: "Edit",
                      onTap: () => context.push("/vehicles/${vehicle.id}/edit"),
                    ),
                  ),
                  VerticalDivider(width: 1, thickness: 1, color: border, indent: 10, endIndent: 10),
                  Expanded(
                    child: _RowAction(
                      icon: Icons.visibility_off_outlined,
                      label: vehicle.isActive ? "Deactivate" : "Inactive",
                      color: vehicle.isActive ? AppColors.danger : null,
                      onTap: vehicle.isActive
                          ? () async {
                              await ref.read(marketplaceApiProvider).vehicles.deactivate(vehicle.id);
                              ref.invalidate(_myVehiclesProvider);
                            }
                          : null,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RowAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Color? color;
  const _RowAction({required this.icon, required this.label, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final isEnabled = onTap != null;
    final fg = !isEnabled
        ? AppColors.mutedTextOf(context)
        : color ?? Theme.of(context).colorScheme.primary;
    return InkWell(
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 17, color: fg),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: fg),
            ),
          ),
        ],
      ),
    );
  }
}
