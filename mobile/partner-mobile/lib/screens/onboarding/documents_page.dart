import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_core/mobile_core.dart';

import '../../providers/partner_profile_provider.dart';

const _documentTypes = [
  ("BUSINESS_LICENSE", "Business license"),
  ("GST_CERTIFICATE", "GST certificate"),
  ("IDENTITY_PROOF", "Identity proof"),
  ("ADDRESS_PROOF", "Address proof"),
  ("BANK_PROOF", "Bank proof"),
  ("OTHER", "Other"),
];

class DocumentsPage extends ConsumerStatefulWidget {
  const DocumentsPage({super.key});

  @override
  ConsumerState<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends ConsumerState<DocumentsPage> {
  bool _uploading = false;

  Future<void> _upload(String type) async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final bytes = await File(file.path).readAsBytes();
      final url = bytesToDataUrl(bytes, mimeType: mimeTypeForPath(file.path));
      await ref.read(marketplaceApiProvider).rentalPartners.uploadDocument(type: type, fileUrl: url);
      ref.invalidate(partnerProfileProvider);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(partnerProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("KYC documents")),
      body: profileAsync.when(
        data: (profile) {
          final documents = profile?.documents ?? [];
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                "Upload the documents below for our team to verify your business. You can list vehicles once verification is approved.",
                style: TextStyle(color: AppColors.mutedTextOf(context)),
              ),
              const SizedBox(height: 20),
              for (final (type, label) in _documentTypes) ...[
                _DocumentRow(
                  label: label,
                  existing: documents.where((d) => d.type.toJson() == type).toList(),
                  onUpload: _uploading ? null : () => _upload(type),
                ),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 12),
              ElevatedButton(onPressed: () => context.go("/onboarding/bank-details"), child: const Text("Continue to bank details")),
            ],
          );
        },
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e"),
      ),
    );
  }
}

class _DocumentRow extends StatelessWidget {
  final String label;
  final List<BusinessDocument> existing;
  final VoidCallback? onUpload;
  const _DocumentRow({required this.label, required this.existing, required this.onUpload});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                  if (existing.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: StatusBadge.document(existing.last.status),
                    ),
                ],
              ),
            ),
            TextButton.icon(
              onPressed: onUpload,
              icon: const Icon(Icons.upload_outlined, size: 18),
              label: Text(existing.isEmpty ? "Upload" : "Re-upload"),
            ),
          ],
        ),
      ),
    );
  }
}
