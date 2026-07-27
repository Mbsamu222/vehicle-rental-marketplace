import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _walletProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).payments.wallet());

class WalletPage extends ConsumerWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(_walletProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Wallet")),
      body: walletAsync.when(
        data: (wallet) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(_walletProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                color: AppColors.isDark(context) ? AppColors.darkSurface : AppColors.primary900,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Balance", style: TextStyle(color: Colors.white70)),
                      const SizedBox(height: 8),
                      Text(formatCurrency(wallet.balance, precise: true),
                          style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text("Recent transactions", style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              if (wallet.transactions.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Text("No transactions yet.", style: TextStyle(color: AppColors.mutedTextOf(context))),
                )
              else
                for (final tx in wallet.transactions) _TransactionTile(tx: tx),
            ],
          ),
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_walletProvider)),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final WalletTransaction tx;
  const _TransactionTile({required this.tx});

  bool get _isCredit => tx.type == TransactionType.walletTopup || tx.type == TransactionType.refund;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: (_isCredit ? AppColors.success : AppColors.danger).withValues(alpha: 0.12),
        child: Icon(_isCredit ? Icons.add : Icons.remove, color: _isCredit ? AppColors.success : AppColors.danger),
      ),
      title: Text(tx.type.label),
      subtitle: Text(formatDateTime(tx.createdAt)),
      trailing: Text(
        "${_isCredit ? '+' : '−'} ${formatCurrency(tx.amount, precise: true)}",
        style: TextStyle(fontWeight: FontWeight.w700, color: _isCredit ? AppColors.success : AppColors.danger),
      ),
    );
  }
}
