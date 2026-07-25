import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_core/mobile_core.dart';

final _licensesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).users.drivingLicenses());

class DrivingLicensesPage extends ConsumerWidget {
  const DrivingLicensesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final licensesAsync = ref.watch(_licensesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Driving licenses")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final added = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            builder: (context) => const _AddLicenseSheet(),
          );
          if (added == true) ref.invalidate(_licensesProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text("Add license"),
      ),
      body: licensesAsync.when(
        data: (licenses) => licenses.isEmpty
            ? const EmptyState(icon: Icons.badge_outlined, title: "No driving licenses", message: "Add one before booking a vehicle.")
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                itemCount: licenses.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final license = licenses[i];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(license.licenseNumber, style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text("Expires ${formatDate(license.expiryDate)}", style: const TextStyle(color: AppColors.primary400, fontSize: 12)),
                                if (license.rejectionReason != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(license.rejectionReason!, style: const TextStyle(color: AppColors.danger, fontSize: 12)),
                                  ),
                              ],
                            ),
                          ),
                          StatusBadge(
                            label: switch (license.status) {
                              DrivingLicenseStatus.verified => "Verified",
                              DrivingLicenseStatus.rejected => "Rejected",
                              _ => "Pending review",
                            },
                            tone: switch (license.status) {
                              DrivingLicenseStatus.verified => BadgeTone.success,
                              DrivingLicenseStatus.rejected => BadgeTone.danger,
                              _ => BadgeTone.warning,
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_licensesProvider)),
      ),
    );
  }
}

class _AddLicenseSheet extends ConsumerStatefulWidget {
  const _AddLicenseSheet();

  @override
  ConsumerState<_AddLicenseSheet> createState() => _AddLicenseSheetState();
}

class _AddLicenseSheetState extends ConsumerState<_AddLicenseSheet> {
  final _licenseNumber = TextEditingController();
  DateTime? _expiry;
  XFile? _frontImage;
  XFile? _backImage;
  String? _error;

  @override
  void dispose() {
    _licenseNumber.dispose();
    super.dispose();
  }

  Future<void> _pickImage({required bool front}) async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;
    setState(() => front ? _frontImage = file : _backImage = file);
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_licenseNumber.text.trim().isEmpty || _expiry == null || _frontImage == null) {
      setState(() => _error = "License number, expiry date, and a front image are required");
      return;
    }
    try {
      final frontBytes = await File(_frontImage!.path).readAsBytes();
      final frontUrl = bytesToDataUrl(frontBytes, mimeType: mimeTypeForPath(_frontImage!.path));
      String? backUrl;
      if (_backImage != null) {
        final backBytes = await File(_backImage!.path).readAsBytes();
        backUrl = bytesToDataUrl(backBytes, mimeType: mimeTypeForPath(_backImage!.path));
      }
      await ref.read(marketplaceApiProvider).users.addDrivingLicense(
            licenseNumber: _licenseNumber.text.trim(),
            frontImageUrl: frontUrl,
            backImageUrl: backUrl,
            expiryDate: _expiry!,
          );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 20 + MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Add driving license", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: AppColors.danger)),
              const SizedBox(height: 12),
            ],
            TextField(controller: _licenseNumber, decoration: const InputDecoration(labelText: "License number")),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365 * 20)),
                  initialDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) setState(() => _expiry = date);
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: "Expiry date"),
                child: Text(_expiry != null ? formatDate(_expiry!) : "Select date"),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(front: true),
                    icon: const Icon(Icons.upload_outlined),
                    label: Text(_frontImage != null ? "Front ✓" : "Upload front"),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(front: false),
                    icon: const Icon(Icons.upload_outlined),
                    label: Text(_backImage != null ? "Back ✓" : "Upload back"),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            LoadingButton(label: "Submit for verification", onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
