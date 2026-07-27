import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import '../../providers/partner_profile_provider.dart';

class BankDetailsPage extends ConsumerStatefulWidget {
  const BankDetailsPage({super.key});

  @override
  ConsumerState<BankDetailsPage> createState() => _BankDetailsPageState();
}

class _BankDetailsPageState extends ConsumerState<BankDetailsPage> {
  final _accountHolder = TextEditingController();
  final _accountNumber = TextEditingController();
  final _ifscCode = TextEditingController();
  final _bankName = TextEditingController();
  final _branch = TextEditingController();
  final _upiId = TextEditingController();
  String? _error;
  bool _prefilled = false;

  void _prefill(BankDetail? details) {
    if (_prefilled || details == null) return;
    _prefilled = true;
    _accountHolder.text = details.accountHolder;
    _accountNumber.text = details.accountNumber;
    _ifscCode.text = details.ifscCode;
    _bankName.text = details.bankName;
    _branch.text = details.branch ?? "";
    _upiId.text = details.upiId ?? "";
  }

  @override
  void dispose() {
    _accountHolder.dispose();
    _accountNumber.dispose();
    _ifscCode.dispose();
    _bankName.dispose();
    _branch.dispose();
    _upiId.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if ([_accountHolder, _accountNumber, _ifscCode, _bankName].any((c) => c.text.trim().isEmpty)) {
      setState(() => _error = "Account holder, number, IFSC, and bank name are required");
      return;
    }
    try {
      await ref.read(marketplaceApiProvider).rentalPartners.setBankDetails({
        "accountHolder": _accountHolder.text.trim(),
        "accountNumber": _accountNumber.text.trim(),
        "ifscCode": _ifscCode.text.trim(),
        "bankName": _bankName.text.trim(),
        if (_branch.text.trim().isNotEmpty) "branch": _branch.text.trim(),
        if (_upiId.text.trim().isNotEmpty) "upiId": _upiId.text.trim(),
      });
      ref.invalidate(partnerProfileProvider);
      if (mounted) context.go("/");
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(partnerProfileProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Bank details")),
      body: profileAsync.when(
        data: (profile) {
          _prefill(profile?.bankDetails);
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Payouts for completed bookings are sent to this account.", style: TextStyle(color: AppColors.mutedTextOf(context))),
                const SizedBox(height: 20),
                if (_error != null) ...[Text(_error!, style: const TextStyle(color: AppColors.danger)), const SizedBox(height: 12)],
                TextField(controller: _accountHolder, decoration: const InputDecoration(labelText: "Account holder name")),
                const SizedBox(height: 16),
                TextField(controller: _accountNumber, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Account number")),
                const SizedBox(height: 16),
                TextField(controller: _ifscCode, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: "IFSC code")),
                const SizedBox(height: 16),
                TextField(controller: _bankName, decoration: const InputDecoration(labelText: "Bank name")),
                const SizedBox(height: 16),
                TextField(controller: _branch, decoration: const InputDecoration(labelText: "Branch (optional)")),
                const SizedBox(height: 16),
                TextField(controller: _upiId, decoration: const InputDecoration(labelText: "UPI ID (optional)")),
                const SizedBox(height: 24),
                LoadingButton(label: "Save & finish", onPressed: _submit),
              ],
            ),
          );
        },
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e"),
      ),
    );
  }
}
