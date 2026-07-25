import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _couponsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).coupons.list(limit: 50));

class CouponsPage extends ConsumerWidget {
  const CouponsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final couponsAsync = ref.watch(_couponsProvider);
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: DashboardTopBar(
        title: "Coupons",
        userName: user?.fullName,
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final changed = await context.push<bool>("/coupons/new");
          if (changed == true) ref.invalidate(_couponsProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text("New coupon"),
      ),
      body: couponsAsync.when(
        data: (page) => page.items.isEmpty
            ? const EmptyState(icon: Icons.local_offer_outlined, title: "No coupons yet")
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_couponsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final coupon = page.items[i];
                    final valueLabel = coupon.type == CouponType.percentage ? "${coupon.value.toStringAsFixed(0)}% off" : "${formatCurrency(coupon.value)} off";
                    return AppCard(
                      padding: EdgeInsets.zero,
                      onTap: () async {
                        final changed = await context.push<bool>("/coupons/${coupon.id}/edit");
                        if (changed == true) ref.invalidate(_couponsProvider);
                      },
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        title: Text(coupon.code, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text("$valueLabel · Used ${coupon.usageCount}${coupon.usageLimit != null ? '/${coupon.usageLimit}' : ''}"),
                        trailing: StatusBadge(label: coupon.isActive ? "Active" : "Inactive", tone: coupon.isActive ? BadgeTone.success : BadgeTone.neutral),
                      ),
                    );
                  },
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_couponsProvider)),
      ),
    );
  }
}
