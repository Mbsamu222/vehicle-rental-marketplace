import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/account/payments/PaymentsPage.tsx — the
/// wallet balance and payment-count stats over the customer's payment history.
/// The web renders history as a DataTable; on a phone the same four columns
/// (date, provider, amount, status) read better as rows.
final _paymentsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).payments.mine());
final _walletProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).payments.wallet());

class PaymentsPage extends ConsumerWidget {
  const PaymentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payments = ref.watch(_paymentsProvider);
    final wallet = ref.watch(_walletProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Payments & wallet")),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_paymentsProvider);
          ref.invalidate(_walletProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PageHeader(
              title: "Payments & wallet",
              subtitle: "Review your payment history and wallet balance.",
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    label: "Wallet balance",
                    value: formatCurrency(wallet.valueOrNull?.balance ?? 0, precise: true),
                    icon: Icons.account_balance_wallet_outlined,
                    tone: StatCardTone.accent,
                    onTap: () => context.push("/account/wallet"),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: StatCard(
                    label: "Total payments",
                    value: "${payments.valueOrNull?.meta.total ?? 0}",
                    icon: Icons.receipt_long_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              "Payment history",
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 12),
            payments.when(
              data: (page) => page.items.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.only(top: 24),
                      child: EmptyState(
                        icon: Icons.receipt_long_outlined,
                        title: "No payments yet",
                        message: "Payments for your bookings will show up here.",
                      ),
                    )
                  : Column(
                      children: [
                        for (final payment in page.items) ...[
                          _PaymentRow(payment: payment),
                          const SizedBox(height: 10),
                        ],
                      ],
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_paymentsProvider)),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final Payment payment;
  const _PaymentRow({required this.payment});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      onTap: () => context.push("/bookings/${payment.bookingId}"),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  formatCurrency(payment.amount, precise: true),
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                ),
                const SizedBox(height: 3),
                Text(
                  "${_providerLabel(payment.provider)} · ${formatDate(payment.createdAt)}",
                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                ),
                if (payment.refundedAmount > 0) ...[
                  const SizedBox(height: 3),
                  Text(
                    "${formatCurrency(payment.refundedAmount, precise: true)} refunded",
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.warning),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          StatusBadge.payment(payment.status),
        ],
      ),
    );
  }

  static String _providerLabel(PaymentProvider provider) => switch (provider) {
        PaymentProvider.razorpay => "Razorpay",
        PaymentProvider.stripe => "Stripe",
        PaymentProvider.wallet => "Wallet",
      };
}
