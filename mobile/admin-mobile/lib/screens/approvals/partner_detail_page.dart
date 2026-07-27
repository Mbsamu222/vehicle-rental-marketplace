import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _partnerProvider = FutureProvider.autoDispose.family<RentalPartner, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).rentalPartners.byId(id),
);

class PartnerDetailPage extends ConsumerWidget {
  final String partnerId;
  const PartnerDetailPage({super.key, required this.partnerId});

  Future<void> _reviewDocument(BuildContext context, WidgetRef ref, BusinessDocument doc, String status) async {
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
    await ref.read(marketplaceApiProvider).rentalPartners.reviewDocument(doc.id, status: status, rejectionReason: rejectionReason);
    ref.invalidate(_partnerProvider(partnerId));
  }

  Future<void> _updateVerification(BuildContext context, WidgetRef ref, String status) async {
    try {
      await ref.read(marketplaceApiProvider).rentalPartners.updateVerificationStatus(partnerId, status);
      ref.invalidate(_partnerProvider(partnerId));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partnerAsync = ref.watch(_partnerProvider(partnerId));
    return Scaffold(
      appBar: AppBar(title: const Text("Partner details")),
      body: partnerAsync.when(
        data: (partner) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(child: Text(partner.businessName, style: Theme.of(context).textTheme.titleLarge)),
                StatusBadge.verification(partner.verificationStatus),
              ],
            ),
            Text(partner.city?.name ?? "", style: TextStyle(color: AppColors.mutedTextOf(context))),
            const SizedBox(height: 16),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const AppCardHeader(title: "Business info"),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _InfoRow(label: "Owner", value: partner.user?.fullName ?? "—"),
                        _InfoRow(label: "Email", value: partner.businessEmail),
                        _InfoRow(label: "Phone", value: partner.businessPhone),
                        _InfoRow(label: "Address", value: partner.address),
                        if (partner.description != null) _InfoRow(label: "Description", value: partner.description!),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const AppCardHeader(title: "Bank details"),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: partner.bankDetails == null
                        ? Text("Not provided yet.", style: TextStyle(color: AppColors.mutedTextOf(context)))
                        : Column(
                            children: [
                              _InfoRow(label: "Account holder", value: partner.bankDetails!.accountHolder),
                              _InfoRow(label: "Account number", value: partner.bankDetails!.accountNumber),
                              _InfoRow(label: "IFSC", value: partner.bankDetails!.ifscCode),
                              _InfoRow(label: "Bank", value: partner.bankDetails!.bankName),
                            ],
                          ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const AppCardHeader(title: "KYC documents"),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: partner.documents.isEmpty
                        ? Text("No documents uploaded yet.", style: TextStyle(color: AppColors.mutedTextOf(context)))
                        : Column(
                            children: [
                              for (final doc in partner.documents)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.subtleFillOf(context),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(child: Text(doc.type.toJson().replaceAll("_", " "), style: const TextStyle(fontWeight: FontWeight.w600))),
                                            StatusBadge.document(doc.status),
                                          ],
                                        ),
                                        if (doc.rejectionReason != null)
                                          Padding(padding: const EdgeInsets.only(top: 4), child: Text(doc.rejectionReason!, style: const TextStyle(color: AppColors.danger, fontSize: 12))),
                                        if (doc.status == DocumentStatus.pending)
                                          Row(
                                            children: [
                                              TextButton(onPressed: () => _reviewDocument(context, ref, doc, "APPROVED"), child: const Text("Approve")),
                                              TextButton(onPressed: () => _reviewDocument(context, ref, doc, "REJECTED"), child: const Text("Reject")),
                                            ],
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const AppCardHeader(title: "Verification decision"),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        if (partner.verificationStatus != PartnerVerificationStatus.underReview)
                          OutlinedButton(onPressed: () => _updateVerification(context, ref, "UNDER_REVIEW"), child: const Text("Mark under review")),
                        if (partner.verificationStatus != PartnerVerificationStatus.verified)
                          ElevatedButton(onPressed: () => _updateVerification(context, ref, "VERIFIED"), child: const Text("Verify")),
                        if (partner.verificationStatus != PartnerVerificationStatus.rejected)
                          OutlinedButton(onPressed: () => _updateVerification(context, ref, "REJECTED"), child: const Text("Reject")),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_partnerProvider(partnerId))),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(label, style: TextStyle(color: AppColors.mutedTextOf(context)))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
