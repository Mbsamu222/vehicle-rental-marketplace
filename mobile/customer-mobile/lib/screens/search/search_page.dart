import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;
import 'package:mobile_core/mobile_core.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  String? _cityId;
  String? _cityName;
  String? _categoryId;
  String? _sortBy;
  bool _initialized = false;

  List<Vehicle> _items = [];
  int _page = 1;
  bool _hasMore = true;
  bool _loading = false;
  String? _error;

  bool _mapMode = false;
  bool _loadingNearby = false;
  String? _nearbyError;
  gmaps.LatLng? _userLocation;
  List<Vehicle> _nearbyItems = [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final query = GoRouterState.of(context).uri.queryParameters;
      _cityId = query["cityId"];
      _cityName = query["cityName"];
      _categoryId = query["categoryId"];
      _loadPage(reset: true);
    }
  }

  Future<void> _loadPage({bool reset = false}) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
      if (reset) {
        _page = 1;
        _items = [];
        _hasMore = true;
      }
    });
    try {
      final result = await ref.read(marketplaceApiProvider).vehicles.search(
            VehicleSearchFilters(cityId: _cityId, categoryId: _categoryId, sortBy: _sortBy),
            page: _page,
            limit: 20,
          );
      setState(() {
        _items = reset ? result.items : [..._items, ...result.items];
        _hasMore = result.meta.hasMore;
        _page += 1;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleMapMode() async {
    if (_mapMode) {
      setState(() => _mapMode = false);
      return;
    }
    setState(() {
      _mapMode = true;
      _nearbyError = null;
    });
    await _loadNearby();
  }

  Future<void> _loadNearby() async {
    setState(() => _loadingNearby = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() => _nearbyError = "Location permission is needed to show vehicles near you.");
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      final result = await ref.read(marketplaceApiProvider).vehicles.nearby(
            latitude: position.latitude,
            longitude: position.longitude,
            radiusKm: 15,
            categoryId: _categoryId,
          );
      setState(() {
        _userLocation = gmaps.LatLng(position.latitude, position.longitude);
        _nearbyItems = result.items;
      });
    } on ApiException catch (e) {
      setState(() => _nearbyError = e.message);
    } catch (_) {
      setState(() => _nearbyError = "Couldn't get your location.");
    } finally {
      if (mounted) setState(() => _loadingNearby = false);
    }
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<Map<String, String?>>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _FilterSheet(cityId: _cityId, categoryId: _categoryId, sortBy: _sortBy),
    );
    if (result != null) {
      setState(() {
        _cityId = result["cityId"];
        _categoryId = result["categoryId"];
        _sortBy = result["sortBy"];
        _cityName = null;
      });
      _loadPage(reset: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_cityName != null ? "Vehicles in $_cityName" : "Search"),
        actions: [
          IconButton(
            icon: Icon(_mapMode ? Icons.list : Icons.map_outlined),
            tooltip: _mapMode ? "List view" : "Near me (map view)",
            onPressed: _toggleMapMode,
          ),
          IconButton(icon: const Icon(Icons.tune), onPressed: _openFilters),
        ],
      ),
      body: _mapMode ? _buildMapView() : _buildListView(),
    );
  }

  Widget _buildMapView() {
    if (_loadingNearby) return const SectionLoading();
    if (_nearbyError != null) return ErrorView(message: _nearbyError!, onRetry: _loadNearby);
    if (_userLocation == null) return const SectionLoading();
    if (_nearbyItems.isEmpty) {
      return const EmptyState(icon: Icons.map_outlined, title: "No vehicles nearby", message: "Try again later or widen your filters.");
    }
    return gmaps.GoogleMap(
      initialCameraPosition: gmaps.CameraPosition(target: _userLocation!, zoom: 12),
      markers: {
        gmaps.Marker(markerId: const gmaps.MarkerId("me"), position: _userLocation!, infoWindow: const gmaps.InfoWindow(title: "You")),
        for (final v in _nearbyItems.where((v) => v.latitude != null && v.longitude != null))
          gmaps.Marker(
            markerId: gmaps.MarkerId(v.id),
            position: gmaps.LatLng(v.latitude!, v.longitude!),
            infoWindow: gmaps.InfoWindow(
              title: v.model,
              snippet: formatCurrency(v.pricePerDay),
              onTap: () => context.push("/vehicle/${v.id}"),
            ),
          ),
      },
    );
  }

  Widget _buildListView() {
    return _error != null && _items.isEmpty
          ? ErrorView(message: _error!, onRetry: () => _loadPage(reset: true))
          : RefreshIndicator(
              onRefresh: () => _loadPage(reset: true),
              child: _items.isEmpty && !_loading
                  ? const EmptyState(icon: Icons.directions_car_outlined, title: "No vehicles found", message: "Try adjusting your filters.")
                  : NotificationListener<ScrollNotification>(
                      onNotification: (notification) {
                        if (notification.metrics.pixels > notification.metrics.maxScrollExtent - 300 &&
                            _hasMore &&
                            !_loading) {
                          _loadPage();
                        }
                        return false;
                      },
                      child: GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: 0.6,
                        ),
                        itemCount: _items.length + (_hasMore ? 1 : 0),
                        itemBuilder: (context, i) {
                          if (i >= _items.length) {
                            return const Center(child: CircularProgressIndicator());
                          }
                          final vehicle = _items[i];
                          return VehicleCard(
                            vehicle: vehicle,
                            width: double.infinity,
                            onTap: () => context.push("/vehicle/${vehicle.id}"),
                          );
                        },
                      ),
                    ),
            );
  }
}

class _FilterSheet extends ConsumerStatefulWidget {
  final String? cityId;
  final String? categoryId;
  final String? sortBy;
  const _FilterSheet({this.cityId, this.categoryId, this.sortBy});

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  late String? _cityId = widget.cityId;
  late String? _categoryId = widget.categoryId;
  late String? _sortBy = widget.sortBy;

  @override
  Widget build(BuildContext context) {
    final cities = ref.watch(FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities()));
    final categories = ref.watch(FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleCategories()));

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 20 + MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Filters", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            const Text("City", style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            cities.when(
              data: (list) => Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final city in list)
                    ChoiceChip(
                      label: Text(city.name),
                      selected: _cityId == city.id,
                      onSelected: (v) => setState(() => _cityId = v ? city.id : null),
                    ),
                ],
              ),
              loading: () => const SectionLoading(),
              error: (e, _) => Text("$e"),
            ),
            const SizedBox(height: 16),
            const Text("Category", style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            categories.when(
              data: (list) => Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final category in list)
                    ChoiceChip(
                      label: Text(category.name),
                      selected: _categoryId == category.id,
                      onSelected: (v) => setState(() => _categoryId = v ? category.id : null),
                    ),
                ],
              ),
              loading: () => const SectionLoading(),
              error: (e, _) => Text("$e"),
            ),
            const SizedBox(height: 16),
            const Text("Sort by", style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(label: const Text("Newest"), selected: _sortBy == null, onSelected: (_) => setState(() => _sortBy = null)),
                ChoiceChip(label: const Text("Price: low to high"), selected: _sortBy == "price_asc", onSelected: (_) => setState(() => _sortBy = "price_asc")),
                ChoiceChip(label: const Text("Price: high to low"), selected: _sortBy == "price_desc", onSelected: (_) => setState(() => _sortBy = "price_desc")),
                ChoiceChip(label: const Text("Rating"), selected: _sortBy == "rating", onSelected: (_) => setState(() => _sortBy = "rating")),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop({"cityId": _cityId, "categoryId": _categoryId, "sortBy": _sortBy}),
              child: const Text("Apply filters"),
            ),
          ],
        ),
      ),
    );
  }
}
