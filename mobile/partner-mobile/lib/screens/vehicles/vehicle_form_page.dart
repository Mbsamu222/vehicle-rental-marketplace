import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _categoriesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleCategories());
final _brandsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleBrands());
final _citiesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities());
final _vehicleProvider = FutureProvider.autoDispose.family<Vehicle, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).vehicles.byId(id),
);

class VehicleFormPage extends ConsumerStatefulWidget {
  final String? vehicleId;
  const VehicleFormPage({super.key, this.vehicleId});

  @override
  ConsumerState<VehicleFormPage> createState() => _VehicleFormPageState();
}

class _VehicleFormPageState extends ConsumerState<VehicleFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _model = TextEditingController();
  final _year = TextEditingController();
  final _registrationNumber = TextEditingController();
  final _seatingCapacity = TextEditingController();
  final _pricePerHour = TextEditingController();
  final _pricePerDay = TextEditingController();
  final _securityDeposit = TextEditingController(text: "0");
  final _insuranceDetails = TextEditingController();
  final _rentalPolicies = TextEditingController();
  String? _categoryId;
  String? _brandId;
  String? _cityId;
  String _transmission = "MANUAL";
  String _fuelType = "PETROL";
  String? _error;
  bool _prefilled = false;

  bool get _isEditing => widget.vehicleId != null;

  void _prefill(Vehicle vehicle) {
    if (_prefilled) return;
    _prefilled = true;
    _model.text = vehicle.model;
    _year.text = "${vehicle.year}";
    _registrationNumber.text = vehicle.registrationNumber;
    _seatingCapacity.text = "${vehicle.seatingCapacity}";
    _pricePerHour.text = "${vehicle.pricePerHour}";
    _pricePerDay.text = "${vehicle.pricePerDay}";
    _securityDeposit.text = "${vehicle.securityDeposit}";
    _insuranceDetails.text = vehicle.insuranceDetails ?? "";
    _rentalPolicies.text = vehicle.rentalPolicies ?? "";
    _categoryId = vehicle.categoryId;
    _brandId = vehicle.brandId;
    _cityId = vehicle.cityId;
    _transmission = vehicle.transmission.toJson();
    _fuelType = vehicle.fuelType.toJson();
  }

  @override
  void dispose() {
    _model.dispose();
    _year.dispose();
    _registrationNumber.dispose();
    _seatingCapacity.dispose();
    _pricePerHour.dispose();
    _pricePerDay.dispose();
    _securityDeposit.dispose();
    _insuranceDetails.dispose();
    _rentalPolicies.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _categoryId == null || _brandId == null || _cityId == null) {
      setState(() => _error = "All dropdowns are required");
      return;
    }
    setState(() => _error = null);
    final payload = {
      "categoryId": _categoryId,
      "brandId": _brandId,
      "cityId": _cityId,
      "model": _model.text.trim(),
      "year": int.parse(_year.text.trim()),
      "registrationNumber": _registrationNumber.text.trim(),
      "transmission": _transmission,
      "fuelType": _fuelType,
      "seatingCapacity": int.parse(_seatingCapacity.text.trim()),
      "pricePerHour": double.parse(_pricePerHour.text.trim()),
      "pricePerDay": double.parse(_pricePerDay.text.trim()),
      "securityDeposit": double.tryParse(_securityDeposit.text.trim()) ?? 0,
      if (_insuranceDetails.text.trim().isNotEmpty) "insuranceDetails": _insuranceDetails.text.trim(),
      if (_rentalPolicies.text.trim().isNotEmpty) "rentalPolicies": _rentalPolicies.text.trim(),
    };
    try {
      final api = ref.read(marketplaceApiProvider).vehicles;
      if (_isEditing) {
        await api.update(widget.vehicleId!, payload);
      } else {
        final created = await api.create(payload);
        if (mounted) {
          context.pushReplacement("/vehicles/${created.id}/images");
          return;
        }
      }
      if (mounted) context.pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(_categoriesProvider);
    final brands = ref.watch(_brandsProvider);
    final cities = ref.watch(_citiesProvider);
    final vehicleAsync = _isEditing ? ref.watch(_vehicleProvider(widget.vehicleId!)) : null;

    Widget form() => SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_error != null) ...[Text(_error!, style: const TextStyle(color: AppColors.danger)), const SizedBox(height: 12)],
                TextFormField(controller: _model, decoration: const InputDecoration(labelText: "Model"), validator: (v) => (v == null || v.isEmpty) ? "Required" : null),
                const SizedBox(height: 16),
                categories.when(
                  data: (list) => DropdownButtonFormField<String>(
                    initialValue: _categoryId,
                    decoration: const InputDecoration(labelText: "Category"),
                    items: [for (final c in list) DropdownMenuItem(value: c.id, child: Text(c.name))],
                    onChanged: (v) => setState(() => _categoryId = v),
                  ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => Text("$e"),
                ),
                const SizedBox(height: 16),
                brands.when(
                  data: (list) => DropdownButtonFormField<String>(
                    initialValue: _brandId,
                    decoration: const InputDecoration(labelText: "Brand"),
                    items: [for (final b in list) DropdownMenuItem(value: b.id, child: Text(b.name))],
                    onChanged: (v) => setState(() => _brandId = v),
                  ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => Text("$e"),
                ),
                const SizedBox(height: 16),
                cities.when(
                  data: (list) => DropdownButtonFormField<String>(
                    initialValue: _cityId,
                    decoration: const InputDecoration(labelText: "City"),
                    items: [for (final c in list) DropdownMenuItem(value: c.id, child: Text(c.name))],
                    onChanged: (v) => setState(() => _cityId = v),
                  ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => Text("$e"),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: TextFormField(controller: _year, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Year"), validator: (v) => (v == null || int.tryParse(v) == null) ? "Invalid" : null)),
                    const SizedBox(width: 12),
                    Expanded(child: TextFormField(controller: _seatingCapacity, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Seats"), validator: (v) => (v == null || int.tryParse(v) == null) ? "Invalid" : null)),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(controller: _registrationNumber, decoration: const InputDecoration(labelText: "Registration number"), validator: (v) => (v == null || v.isEmpty) ? "Required" : null),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _transmission,
                        decoration: const InputDecoration(labelText: "Transmission"),
                        items: const [DropdownMenuItem(value: "MANUAL", child: Text("Manual")), DropdownMenuItem(value: "AUTOMATIC", child: Text("Automatic"))],
                        onChanged: (v) => setState(() => _transmission = v!),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _fuelType,
                        decoration: const InputDecoration(labelText: "Fuel"),
                        items: const [
                          DropdownMenuItem(value: "PETROL", child: Text("Petrol")),
                          DropdownMenuItem(value: "DIESEL", child: Text("Diesel")),
                          DropdownMenuItem(value: "ELECTRIC", child: Text("Electric")),
                          DropdownMenuItem(value: "HYBRID", child: Text("Hybrid")),
                          DropdownMenuItem(value: "CNG", child: Text("CNG")),
                        ],
                        onChanged: (v) => setState(() => _fuelType = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: TextFormField(controller: _pricePerHour, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: "Price / hour"), validator: (v) => (v == null || double.tryParse(v) == null) ? "Invalid" : null)),
                    const SizedBox(width: 12),
                    Expanded(child: TextFormField(controller: _pricePerDay, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: "Price / day"), validator: (v) => (v == null || double.tryParse(v) == null) ? "Invalid" : null)),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(controller: _securityDeposit, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: "Security deposit")),
                const SizedBox(height: 16),
                TextFormField(controller: _insuranceDetails, maxLines: 2, decoration: const InputDecoration(labelText: "Insurance details (optional)")),
                const SizedBox(height: 16),
                TextFormField(controller: _rentalPolicies, maxLines: 3, decoration: const InputDecoration(labelText: "Rental policies (optional)")),
                const SizedBox(height: 24),
                LoadingButton(label: _isEditing ? "Save changes" : "Create vehicle", onPressed: _submit),
                if (!_isEditing) ...[
                  const SizedBox(height: 8),
                  Text("Editing a vehicle sends it back for admin re-approval.", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                ],
              ],
            ),
          ),
        );

    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? "Edit vehicle" : "Add vehicle")),
      body: _isEditing
          ? vehicleAsync!.when(
              data: (vehicle) {
                _prefill(vehicle);
                return form();
              },
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e"),
            )
          : form(),
    );
  }
}
