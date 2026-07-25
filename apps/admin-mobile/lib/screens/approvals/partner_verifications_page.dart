import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _statusFilterProvider = StateProvider.autoDispose<String?>((ref) => "PENDING");
final _partnersProvider = FutureProvider.autoDispose((ref) {
  final status = ref.watch(_statusFilterProvider);
  return ref.watch(marketplaceApiProvider).rentalPartners.list(status: status, limit: 50);
});

const _filters = [
  ("PENDING", "Pending"),
  ("UNDER_REVIEW", "Under review"),
  ("VERIFIED", "Verified"),
  ("REJECTED", "Rejected"),
  (null, "All"),
];

class PartnerVerificationsPage extends ConsumerWidget {
  const PartnerVerificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(_statusFilterProvider);
    final partnersAsync = ref.watch(_partnersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Partner verification")),
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
            child: partnersAsync.when(
              data: (page) => page.items.isEmpty
                  ? const EmptyState(icon: Icons.storefront_outlined, title: "No partners here")
                  : RefreshIndicator(
                      onRefresh: () async => ref.invalidate(_partnersProvider),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: page.items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final partner = page.items[i];
                          return Card(
                            child: ListTile(
                              title: Text(partner.businessName, style: const TextStyle(fontWeight: FontWeight.w700)),
                              subtitle: Text(partner.city?.name ?? ""),
                              trailing: StatusBadge.verification(partner.verificationStatus),
                              onTap: () => context.push("/approvals/partners/${partner.id}"),
                            ),
                          );
                        },
                      ),
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_partnersProvider)),
            ),
          ),
        ],
      ),
    );
  }
}
