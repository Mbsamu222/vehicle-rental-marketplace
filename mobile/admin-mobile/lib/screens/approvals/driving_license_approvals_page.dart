import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _statusFilterProvider = StateProvider.autoDispose<String?>((ref) => "PENDING");
final _licensesProvider = FutureProvider.autoDispose((ref) {
  final status = ref.watch(_statusFilterProvider);
  return ref.watch(marketplaceApiProvider).admin.drivingLicenses(status: status, limit: 50);
});

const _filters = [("PENDING", "Pending"), ("VERIFIED", "Verified"), ("REJECTED", "Rejected"), (null, "All")];

class DrivingLicenseApprovalsPage extends ConsumerWidget {
  const DrivingLicenseApprovalsPage({super.key});

  Future<void> _review(BuildContext context, WidgetRef ref, DrivingLicense license, String status) async {
    String? rejectionReason;
    if (status == "REJECTED") {
      rejectionReason = await showDialog<String>(
        context: context,
        builder: (context) {
          final controller = TextEditingController();
          return AlertDialog(
            title: const Text("Rejection reason"),
            content: TextField(controller: controller),
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
      await ref.read(marketplaceApiProvider).admin.reviewDrivingLicense(license.id, status: status, rejectionReason: rejectionReason);
      ref.invalidate(_licensesProvider);
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(_statusFilterProvider);
    final licensesAsync = ref.watch(_licensesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Driving license review")),
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
                return ChoiceChip(label: Text(label), selected: selected == value, onSelected: (_) => ref.read(_statusFilterProvider.notifier).state = value);
              },
            ),
          ),
          Expanded(
            child: licensesAsync.when(
              data: (page) => page.items.isEmpty
                  ? const EmptyState(icon: Icons.badge_outlined, title: "No licenses here")
                  : RefreshIndicator(
                      onRefresh: () async => ref.invalidate(_licensesProvider),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: page.items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, i) {
                          final license = page.items[i];
                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(child: Text(license.user?.fullName ?? "Customer", style: const TextStyle(fontWeight: FontWeight.w700))),
                                      StatusBadge(
                                        label: switch (license.status) {
                                          DrivingLicenseStatus.verified => "Verified",
                                          DrivingLicenseStatus.rejected => "Rejected",
                                          _ => "Pending",
                                        },
                                        tone: switch (license.status) {
                                          DrivingLicenseStatus.verified => BadgeTone.success,
                                          DrivingLicenseStatus.rejected => BadgeTone.danger,
                                          _ => BadgeTone.warning,
                                        },
                                      ),
                                    ],
                                  ),
                                  Text("License #${license.licenseNumber} · Expires ${formatDate(license.expiryDate)}", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                                  if (license.status == DrivingLicenseStatus.pending)
                                    Row(
                                      children: [
                                        TextButton(onPressed: () => _review(context, ref, license, "VERIFIED"), child: const Text("Verify")),
                                        TextButton(onPressed: () => _review(context, ref, license, "REJECTED"), child: const Text("Reject")),
                                      ],
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_licensesProvider)),
            ),
          ),
        ],
      ),
    );
  }
}
