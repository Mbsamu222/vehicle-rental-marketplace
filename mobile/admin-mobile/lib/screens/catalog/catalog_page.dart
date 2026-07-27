import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/catalog/CatalogPage.tsx — CRUD over the
/// reference data every other screen depends on: cities, vehicle categories,
/// and vehicle brands.
final _citiesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities());
final _categoriesProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleCategories());
final _brandsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleBrands());
final _countriesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.countries());

class CatalogPage extends ConsumerWidget {
  const CatalogPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Catalog"),
          bottom: const TabBar(tabs: [Tab(text: "Cities"), Tab(text: "Categories"), Tab(text: "Brands")]),
        ),
        body: const TabBarView(children: [_CitiesTab(), _CategoriesTab(), _BrandsTab()]),
      ),
    );
  }
}

class _CitiesTab extends ConsumerWidget {
  const _CitiesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cities = ref.watch(_citiesProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        heroTag: "city",
        onPressed: () => _openCityForm(context, ref, null),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_citiesProvider),
        child: cities.when(
          data: (list) => list.isEmpty
              ? const EmptyState(icon: Icons.location_city_outlined, title: "No cities yet")
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final city = list[i];
                    return _CatalogRow(
                      title: city.name,
                      subtitle: [
                        city.country?.name,
                        if (city.isPopular) "Popular",
                      ].nonNulls.join(" · "),
                      isActive: city.isActive,
                      onEdit: () => _openCityForm(context, ref, city),
                      onDelete: () => _confirmDelete(
                        context,
                        label: city.name,
                        onConfirm: () => ref.read(marketplaceApiProvider).catalog.deleteCity(city.id),
                        onDone: () => ref.invalidate(_citiesProvider),
                      ),
                    );
                  },
                ),
          loading: () => const SectionLoading(),
          error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_citiesProvider)),
        ),
      ),
    );
  }

  void _openCityForm(BuildContext context, WidgetRef ref, City? city) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _CityForm(city: city, onSaved: () => ref.invalidate(_citiesProvider)),
    );
  }
}

class _CategoriesTab extends ConsumerWidget {
  const _CategoriesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(_categoriesProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        heroTag: "category",
        onPressed: () => _openForm(context, ref, null),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_categoriesProvider),
        child: categories.when(
          data: (list) => list.isEmpty
              ? const EmptyState(icon: Icons.grid_view_outlined, title: "No categories yet")
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final category = list[i];
                    return _CatalogRow(
                      title: category.name,
                      subtitle: category.slug,
                      isActive: category.isActive,
                      leading: categoryIcon(category.name),
                      onEdit: () => _openForm(context, ref, category),
                      onDelete: () => _confirmDelete(
                        context,
                        label: category.name,
                        onConfirm: () => ref.read(marketplaceApiProvider).catalog.deleteVehicleCategory(category.id),
                        onDone: () => ref.invalidate(_categoriesProvider),
                      ),
                    );
                  },
                ),
          loading: () => const SectionLoading(),
          error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_categoriesProvider)),
        ),
      ),
    );
  }

  void _openForm(BuildContext context, WidgetRef ref, VehicleCategory? category) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _CategoryForm(category: category, onSaved: () => ref.invalidate(_categoriesProvider)),
    );
  }
}

class _BrandsTab extends ConsumerWidget {
  const _BrandsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brands = ref.watch(_brandsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        heroTag: "brand",
        onPressed: () => _openForm(context, ref, null),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_brandsProvider),
        child: brands.when(
          data: (list) => list.isEmpty
              ? const EmptyState(icon: Icons.branding_watermark_outlined, title: "No brands yet")
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                  itemCount: list.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final brand = list[i];
                    return _CatalogRow(
                      title: brand.name,
                      isActive: brand.isActive,
                      onEdit: () => _openForm(context, ref, brand),
                      onDelete: () => _confirmDelete(
                        context,
                        label: brand.name,
                        onConfirm: () => ref.read(marketplaceApiProvider).catalog.deleteVehicleBrand(brand.id),
                        onDone: () => ref.invalidate(_brandsProvider),
                      ),
                    );
                  },
                ),
          loading: () => const SectionLoading(),
          error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_brandsProvider)),
        ),
      ),
    );
  }

  void _openForm(BuildContext context, WidgetRef ref, VehicleBrand? brand) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _BrandForm(brand: brand, onSaved: () => ref.invalidate(_brandsProvider)),
    );
  }
}

/// Deleting reference data can fail server-side when rows still reference it,
/// so the error is surfaced rather than swallowed.
Future<void> _confirmDelete(
  BuildContext context, {
  required String label,
  required Future<void> Function() onConfirm,
  required VoidCallback onDone,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text("Delete $label?"),
      content: const Text("This can't be undone, and will fail if anything still references it."),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          style: TextButton.styleFrom(foregroundColor: AppColors.danger),
          child: const Text("Delete"),
        ),
      ],
    ),
  );
  if (confirmed != true || !context.mounted) return;

  try {
    await onConfirm();
    onDone();
  } on ApiException catch (e) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
  }
}

class _CatalogRow extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool isActive;
  final IconData? leading;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _CatalogRow({
    required this.title,
    this.subtitle,
    required this.isActive,
    this.leading,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return AppCard(
      padding: const EdgeInsets.all(12),
      onTap: onEdit,
      child: Row(
        children: [
          if (leading != null) ...[
            IconTile(
              icon: leading!,
              background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
              foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
              size: 40,
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textOf(context)),
                ),
                if (subtitle != null && subtitle!.isNotEmpty)
                  Text(subtitle!, style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
              ],
            ),
          ),
          if (!isActive) ...[
            const StatusBadge(label: "Inactive", tone: BadgeTone.neutral),
            const SizedBox(width: 4),
          ],
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.danger),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _CityForm extends ConsumerStatefulWidget {
  final City? city;
  final VoidCallback onSaved;
  const _CityForm({required this.city, required this.onSaved});

  @override
  ConsumerState<_CityForm> createState() => _CityFormState();
}

class _CityFormState extends ConsumerState<_CityForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.city?.name ?? "");
  late final TextEditingController _imageUrl = TextEditingController(text: widget.city?.imageUrl ?? "");
  late String? _countryId = widget.city?.countryId;
  late bool _isPopular = widget.city?.isPopular ?? false;
  late bool _isActive = widget.city?.isActive ?? true;

  @override
  void dispose() {
    _name.dispose();
    _imageUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_countryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Pick a country")));
      return;
    }

    final payload = {
      "name": _name.text.trim(),
      "countryId": _countryId,
      "imageUrl": _imageUrl.text.trim().isEmpty ? null : _imageUrl.text.trim(),
      "isPopular": _isPopular,
      "isActive": _isActive,
    };

    try {
      final api = ref.read(marketplaceApiProvider).catalog;
      if (widget.city == null) {
        await api.createCity(payload);
      } else {
        await api.updateCity(widget.city!.id, payload);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final countries = ref.watch(_countriesProvider);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              widget.city == null ? "New city" : "Edit ${widget.city!.name}",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: "City name"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Name is required" : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _countryId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: "Country"),
              items: [
                for (final country in countries.valueOrNull ?? const <Country>[])
                  DropdownMenuItem(value: country.id, child: Text(country.name)),
              ],
              onChanged: (v) => setState(() => _countryId = v),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _imageUrl,
              decoration: const InputDecoration(labelText: "Image URL (optional)"),
            ),
            const SizedBox(height: 6),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isPopular,
              title: const Text("Show in popular cities"),
              onChanged: (v) => setState(() => _isPopular = v),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isActive,
              title: const Text("Active"),
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: 16),
            LoadingButton(label: widget.city == null ? "Create city" : "Save changes", onPressed: _save),
          ],
        ),
      ),
    );
  }
}

class _CategoryForm extends ConsumerStatefulWidget {
  final VehicleCategory? category;
  final VoidCallback onSaved;
  const _CategoryForm({required this.category, required this.onSaved});

  @override
  ConsumerState<_CategoryForm> createState() => _CategoryFormState();
}

class _CategoryFormState extends ConsumerState<_CategoryForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.category?.name ?? "");
  late final TextEditingController _slug = TextEditingController(text: widget.category?.slug ?? "");
  late final TextEditingController _iconUrl = TextEditingController(text: widget.category?.iconUrl ?? "");
  late bool _isActive = widget.category?.isActive ?? true;

  @override
  void dispose() {
    _name.dispose();
    _slug.dispose();
    _iconUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final payload = {
      "name": _name.text.trim(),
      "slug": _slug.text.trim(),
      "iconUrl": _iconUrl.text.trim().isEmpty ? null : _iconUrl.text.trim(),
      "isActive": _isActive,
    };

    try {
      final api = ref.read(marketplaceApiProvider).catalog;
      if (widget.category == null) {
        await api.createVehicleCategory(payload);
      } else {
        await api.updateVehicleCategory(widget.category!.id, payload);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              widget.category == null ? "New category" : "Edit ${widget.category!.name}",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: "Category name"),
              // Slug is derived from the name only while creating; editing an
              // existing category leaves its slug alone so public links keep
              // resolving.
              onChanged: widget.category != null
                  ? null
                  : (v) => _slug.text = v.trim().toLowerCase().replaceAll(RegExp(r"[^a-z0-9]+"), "-"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Name is required" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _slug,
              decoration: const InputDecoration(labelText: "Slug"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Slug is required" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _iconUrl,
              decoration: const InputDecoration(labelText: "Icon URL (optional)"),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isActive,
              title: const Text("Active"),
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: 16),
            LoadingButton(label: widget.category == null ? "Create category" : "Save changes", onPressed: _save),
          ],
        ),
      ),
    );
  }
}

class _BrandForm extends ConsumerStatefulWidget {
  final VehicleBrand? brand;
  final VoidCallback onSaved;
  const _BrandForm({required this.brand, required this.onSaved});

  @override
  ConsumerState<_BrandForm> createState() => _BrandFormState();
}

class _BrandFormState extends ConsumerState<_BrandForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.brand?.name ?? "");
  late final TextEditingController _logoUrl = TextEditingController(text: widget.brand?.logoUrl ?? "");
  late bool _isActive = widget.brand?.isActive ?? true;

  @override
  void dispose() {
    _name.dispose();
    _logoUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final payload = {
      "name": _name.text.trim(),
      "logoUrl": _logoUrl.text.trim().isEmpty ? null : _logoUrl.text.trim(),
      "isActive": _isActive,
    };

    try {
      final api = ref.read(marketplaceApiProvider).catalog;
      if (widget.brand == null) {
        await api.createVehicleBrand(payload);
      } else {
        await api.updateVehicleBrand(widget.brand!.id, payload);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              widget.brand == null ? "New brand" : "Edit ${widget.brand!.name}",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: "Brand name"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Name is required" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _logoUrl,
              decoration: const InputDecoration(labelText: "Logo URL (optional)"),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isActive,
              title: const Text("Active"),
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: 16),
            LoadingButton(label: widget.brand == null ? "Create brand" : "Save changes", onPressed: _save),
          ],
        ),
      ),
    );
  }
}
