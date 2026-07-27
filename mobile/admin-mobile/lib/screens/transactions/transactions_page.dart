import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/transactions/TransactionsPage.tsx — the
/// platform-wide money ledger, filterable by transaction type.
final _typeFilterProvider = StateProvider.autoDispose<String?>((ref) => null);

final _transactionsProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(marketplaceApiProvider).payments.transactions(
        type: ref.watch(_typeFilterProvider),
        limit: 50,
      ),
);

const _types = <(String, String)>[
  ("BOOKING_PAYMENT", "Bookings"),
  ("REFUND", "Refunds"),
  ("PAYOUT", "Payouts"),
  ("WALLET_TOPUP", "Top-ups"),
  ("COMMISSION", "Commission"),
];

class TransactionsPage extends ConsumerWidget {
  const TransactionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(_transactionsProvider);
    final filter = ref.watch(_typeFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Transactions")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_transactionsProvider),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PageHeader(
              title: "Transactions",
              subtitle: "Every payment, refund, payout, and commission entry on the platform.",
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: const Text("All"),
                      selected: filter == null,
                      onSelected: (_) => ref.read(_typeFilterProvider.notifier).state = null,
                    ),
                  ),
                  for (final (value, label) in _types)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(label),
                        selected: filter == value,
                        onSelected: (_) => ref.read(_typeFilterProvider.notifier).state = value,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            transactions.when(
              data: (page) => page.items.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.only(top: 32),
                      child: EmptyState(icon: Icons.receipt_long_outlined, title: "No transactions"),
                    )
                  : Column(
                      children: [
                        for (final tx in page.items) ...[
                          _TransactionRow(transaction: tx),
                          const SizedBox(height: 10),
                        ],
                      ],
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_transactionsProvider)),
            ),
          ],
        ),
      ),
    );
  }
}

class _TransactionRow extends StatelessWidget {
  final AdminTransaction transaction;
  const _TransactionRow({required this.transaction});

  /// Money leaving the platform (refunds, payouts) is shown negative so the
  /// ledger reads at a glance, matching the web table's amount column.
  bool get _isOutflow =>
      transaction.type == TransactionType.refund || transaction.type == TransactionType.payout;

  @override
  Widget build(BuildContext context) {
    final amount = formatCurrency(transaction.amount, precise: true);
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isOutflow ? "− $amount" : amount,
                  style: TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                    color: _isOutflow ? AppColors.danger : AppColors.textOf(context),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  "${transaction.type.label} · ${formatDateTime(transaction.createdAt)}",
                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                ),
                if (transaction.reference != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    transaction.reference!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: AppColors.mutedTextOf(context)),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          StatusBadge.transaction(transaction.status),
        ],
      ),
    );
  }
}
