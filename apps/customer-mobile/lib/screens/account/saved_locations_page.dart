import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _locationsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).users.savedLocations());
final _citiesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities());

class SavedLocationsPage extends ConsumerWidget {
  const SavedLocationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationsAsync = ref.watch(_locationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Saved locations")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final added = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            builder: (context) => const _AddLocationSheet(),
          );
          if (added == true) ref.invalidate(_locationsProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text("Add"),
      ),
      body: locationsAsync.when(
        data: (locations) => locations.isEmpty
            ? const EmptyState(icon: Icons.location_on_outlined, title: "No saved locations")
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                itemCount: locations.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final loc = locations[i];
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.location_on_outlined, color: AppColors.secondary),
                      title: Text(loc.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(loc.address),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline, color: AppColors.danger),
                        onPressed: () async {
                          await ref.read(marketplaceApiProvider).users.deleteSavedLocation(loc.id);
                          ref.invalidate(_locationsProvider);
                        },
                      ),
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_locationsProvider)),
      ),
    );
  }
}

class _AddLocationSheet extends ConsumerStatefulWidget {
  const _AddLocationSheet();

  @override
  ConsumerState<_AddLocationSheet> createState() => _AddLocationSheetState();
}

class _AddLocationSheetState extends ConsumerState<_AddLocationSheet> {
  final _label = TextEditingController();
  final _address = TextEditingController();
  String? _cityId;
  String? _error;

  @override
  void dispose() {
    _label.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_label.text.trim().isEmpty || _address.text.trim().isEmpty || _cityId == null) {
      setState(() => _error = "Label, city, and address are required");
      return;
    }
    try {
      await ref.read(marketplaceApiProvider).users.addSavedLocation(
            cityId: _cityId!,
            label: _label.text.trim(),
            address: _address.text.trim(),
          );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cities = ref.watch(_citiesProvider);
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 20 + MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Add location", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            if (_error != null) ...[Text(_error!, style: const TextStyle(color: AppColors.danger)), const SizedBox(height: 12)],
            TextField(controller: _label, decoration: const InputDecoration(labelText: "Label (e.g. Home, Office)")),
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
            TextField(controller: _address, maxLines: 2, decoration: const InputDecoration(labelText: "Address")),
            const SizedBox(height: 24),
            LoadingButton(label: "Save location", onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
