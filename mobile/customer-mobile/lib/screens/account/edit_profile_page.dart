import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  late final _firstName = TextEditingController(text: ref.read(authControllerProvider).user?.firstName);
  late final _lastName = TextEditingController(text: ref.read(authControllerProvider).user?.lastName);
  late final _phone = TextEditingController(text: ref.read(authControllerProvider).user?.phone);
  String? _error;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _error = null);
    try {
      await ref.read(marketplaceApiProvider).users.updateProfile({
        "firstName": _firstName.text.trim(),
        "lastName": _lastName.text.trim(),
        if (_phone.text.trim().isNotEmpty) "phone": _phone.text.trim(),
      });
      await ref.read(authControllerProvider.notifier).refresh();
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Edit profile")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: AppColors.danger)),
              const SizedBox(height: 12),
            ],
            TextField(controller: _firstName, decoration: const InputDecoration(labelText: "First name")),
            const SizedBox(height: 16),
            TextField(controller: _lastName, decoration: const InputDecoration(labelText: "Last name")),
            const SizedBox(height: 16),
            TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: "Phone")),
            const SizedBox(height: 24),
            LoadingButton(label: "Save changes", onPressed: _save),
          ],
        ),
      ),
    );
  }
}
