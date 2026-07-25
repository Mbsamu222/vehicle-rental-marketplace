import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import '../../providers/partner_profile_provider.dart';

final _citiesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities());

class BusinessProfileFormPage extends ConsumerStatefulWidget {
  const BusinessProfileFormPage({super.key});

  @override
  ConsumerState<BusinessProfileFormPage> createState() => _BusinessProfileFormPageState();
}

class _BusinessProfileFormPageState extends ConsumerState<BusinessProfileFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _businessName = TextEditingController();
  final _businessEmail = TextEditingController();
  final _businessPhone = TextEditingController();
  final _address = TextEditingController();
  final _description = TextEditingController();
  String? _cityId;
  String? _error;
  bool _prefilled = false;

  void _prefill(RentalPartner partner) {
    if (_prefilled) return;
    _prefilled = true;
    _businessName.text = partner.businessName;
    _businessEmail.text = partner.businessEmail;
    _businessPhone.text = partner.businessPhone;
    _address.text = partner.address;
    _description.text = partner.description ?? "";
    _cityId = partner.cityId;
  }

  @override
  void dispose() {
    _businessName.dispose();
    _businessEmail.dispose();
    _businessPhone.dispose();
    _address.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit(RentalPartner? existing) async {
    if (!_formKey.currentState!.validate() || _cityId == null) {
      setState(() => _error = _cityId == null ? "Select a city" : null);
      return;
    }
    setState(() => _error = null);
    final payload = {
      "businessName": _businessName.text.trim(),
      "businessEmail": _businessEmail.text.trim(),
      "businessPhone": _businessPhone.text.trim(),
      "cityId": _cityId,
      "address": _address.text.trim(),
      if (_description.text.trim().isNotEmpty) "description": _description.text.trim(),
    };
    try {
      final api = ref.read(marketplaceApiProvider).rentalPartners;
      if (existing == null) {
        await api.createProfile(payload);
      } else {
        await api.updateProfile(payload);
      }
      ref.invalidate(partnerProfileProvider);
      if (!mounted) return;
      if (existing == null) {
        context.go("/onboarding/documents");
      } else {
        context.pop();
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(partnerProfileProvider);
    final cities = ref.watch(_citiesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Business profile")),
      body: profileAsync.when(
        data: (existing) {
          if (existing != null) _prefill(existing);
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (existing == null) ...[
                    Text("Tell us about your business", style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    const Text(
                      "You'll upload KYC documents and bank details next. Vehicles can only be listed once an admin verifies your business.",
                      style: TextStyle(color: AppColors.primary400),
                    ),
                    const SizedBox(height: 20),
                  ],
                  if (_error != null) ...[Text(_error!, style: const TextStyle(color: AppColors.danger)), const SizedBox(height: 12)],
                  TextFormField(
                    controller: _businessName,
                    decoration: const InputDecoration(labelText: "Business name"),
                    validator: (v) => (v == null || v.isEmpty) ? "Required" : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _businessEmail,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: "Business email"),
                    validator: (v) => (v == null || !v.contains("@")) ? "Enter a valid email" : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _businessPhone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: "Business phone"),
                    validator: (v) => (v == null || v.isEmpty) ? "Required" : null,
                  ),
                  const SizedBox(height: 16),
                  cities.when(
                    data: (list) => DropdownButtonFormField<String>(
                      initialValue: _cityId,
                      decoration: const InputDecoration(labelText: "City"),
                      items: [for (final city in list) DropdownMenuItem(value: city.id, child: Text(city.name))],
                      onChanged: (v) => setState(() => _cityId = v),
                    ),
                    loading: () => const SectionLoading(),
                    error: (e, _) => Text("$e"),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _address,
                    maxLines: 2,
                    decoration: const InputDecoration(labelText: "Address"),
                    validator: (v) => (v == null || v.isEmpty) ? "Required" : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(controller: _description, maxLines: 3, decoration: const InputDecoration(labelText: "Description (optional)")),
                  const SizedBox(height: 24),
                  LoadingButton(label: existing == null ? "Continue" : "Save changes", onPressed: () => _submit(existing)),
                ],
              ),
            ),
          );
        },
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e"),
      ),
    );
  }
}
