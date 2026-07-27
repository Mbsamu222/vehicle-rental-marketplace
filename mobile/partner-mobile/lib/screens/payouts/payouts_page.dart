import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/partner-web/src/screens/payouts/PayoutsPage.tsx. The web
/// renders a DataTable; the same four fields (date, amount, bookings included,
/// status) read as rows on a phone.
final _payoutsProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).rentalPartners.myPayouts());

class PayoutsPage extends ConsumerWidget {
  const PayoutsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payouts = ref.watch(_payoutsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Payouts")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_payoutsProvider),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PageHeader(
              title: "Payouts",
              subtitle:
                  "Settlements from your completed bookings, net of platform commission (and the payout fee, if enabled). Triggered by the RentWheels team.",
            ),
            const SizedBox(height: 18),
            payouts.when(
              data: (page) => page.items.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.only(top: 20),
                      child: EmptyState(
                        icon: Icons.account_balance_outlined,
                        title: "No payouts yet",
                        message:
                            "Once you have completed bookings, the RentWheels team will settle your earnings here.",
                      ),
                    )
                  : Column(
                      children: [
                        for (final payout in page.items) ...[
                          _PayoutRow(payout: payout),
                          const SizedBox(height: 10),
                        ],
                      ],
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_payoutsProvider)),
            ),
            const SizedBox(height: 14),
            AppCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.account_balance_wallet_outlined, size: 18, color: AppColors.secondary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      "Payout amounts reflect the platform commission rate on your account and, once enabled, a payout/settlement fee. Both are separate from what customers pay at checkout (which includes taxes and refundable security deposits that are never part of a payout).",
                      style: TextStyle(fontSize: 11.5, height: 1.6, color: AppColors.mutedTextOf(context)),
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

class _PayoutRow extends StatelessWidget {
  final AdminTransaction payout;
  const _PayoutRow({required this.payout});

  @override
  Widget build(BuildContext context) {
    final count = payout.bookingCount;
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  formatCurrency(payout.amount, precise: true),
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                ),
                const SizedBox(height: 3),
                Text(
                  formatDateTime(payout.createdAt),
                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                ),
                const SizedBox(height: 3),
                Text(
                  count == null ? "Bookings included: —" : "$count booking${count == 1 ? "" : "s"} included",
                  style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          StatusBadge.transaction(payout.status),
        ],
      ),
    );
  }
}
