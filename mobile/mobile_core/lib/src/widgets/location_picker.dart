import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

import '../config/app_config.dart';
import '../theme/app_colors.dart';
import 'common.dart';

/// Result handed back by [LocationPickerPage] when the user confirms a pin.
class LatLngResult {
  final double latitude;
  final double longitude;
  final String? address;

  const LatLngResult({required this.latitude, required this.longitude, this.address});
}

/// Full-screen map location picker shared by every app: search an address,
/// drag/tap to place the pin, or use the device's current location, then
/// confirm. Push with `context.push<LatLngResult>("/location-picker")`.
///
/// Renders Google's own "for development purposes only" placeholder tiles
/// until a real Maps SDK key is configured natively (see
/// android/app/build.gradle.kts + ios/Runner/AppDelegate.swift in each app)
/// — it does not crash on a missing key, as long as the native SDK is always
/// initialized (Android's manifest meta-data tag present even if empty,
/// iOS's `GMSServices.provideAPIKey` always called).
class LocationPickerPage extends StatefulWidget {
  final LatLngResult? initial;
  final LatLng defaultCenter;

  const LocationPickerPage({
    super.key,
    this.initial,
    this.defaultCenter = const LatLng(20.5937, 78.9629), // India centroid fallback.
  });

  @override
  State<LocationPickerPage> createState() => _LocationPickerPageState();
}

class _LocationPickerPageState extends State<LocationPickerPage> {
  GoogleMapController? _mapController;
  LatLng? _picked;
  String? _address;
  final _searchController = TextEditingController();
  final _dio = Dio(BaseOptions(baseUrl: "https://maps.googleapis.com/maps/api"));
  Timer? _debounce;
  bool _searching = false;
  List<_GeocodeSuggestion> _suggestions = [];

  @override
  void initState() {
    super.initState();
    if (widget.initial != null) {
      _picked = LatLng(widget.initial!.latitude, widget.initial!.longitude);
      _address = widget.initial!.address;
      _searchController.text = _address ?? "";
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  LatLng get _center => _picked ?? widget.defaultCenter;

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.trim().isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () => _geocode(query));
  }

  Future<void> _geocode(String query) async {
    if (AppConfig.googleMapsApiKey.isEmpty) return;
    setState(() => _searching = true);
    try {
      final response = await _dio.get("/geocode/json", queryParameters: {
        "address": query,
        "key": AppConfig.googleMapsApiKey,
      });
      final results = (response.data["results"] as List? ?? []).cast<Map>();
      setState(() {
        _suggestions = results
            .map((r) => _GeocodeSuggestion(
                  address: r["formatted_address"] as String? ?? query,
                  lat: (r["geometry"]?["location"]?["lat"] as num?)?.toDouble() ?? 0,
                  lng: (r["geometry"]?["location"]?["lng"] as num?)?.toDouble() ?? 0,
                ))
            .toList();
      });
    } catch (_) {
      // No key configured yet, or the device is offline — search silently
      // degrades to "no suggestions"; the map/pin still works.
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _selectSuggestion(_GeocodeSuggestion s) {
    setState(() {
      _picked = LatLng(s.lat, s.lng);
      _address = s.address;
      _searchController.text = s.address;
      _suggestions = [];
    });
    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(_picked!, 15));
  }

  void _placePin(LatLng position) {
    setState(() {
      _picked = position;
      _address = null;
    });
  }

  Future<void> _useCurrentLocation() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      await openAppSettings();
      return;
    }
    if (permission == LocationPermission.denied) return;

    final position = await Geolocator.getCurrentPosition();
    final latLng = LatLng(position.latitude, position.longitude);
    setState(() {
      _picked = latLng;
      _address = null;
    });
    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 15));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Choose a location")),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: _center, zoom: _picked != null ? 15 : 4.2),
            onMapCreated: (controller) => _mapController = controller,
            onTap: _placePin,
            markers: _picked != null
                ? {
                    Marker(
                      markerId: const MarkerId("picked"),
                      position: _picked!,
                      draggable: true,
                      onDragEnd: _placePin,
                      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
                    ),
                  }
                : {},
          ),
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Column(
              children: [
                Material(
                  elevation: 3,
                  borderRadius: BorderRadius.circular(14),
                  color: AppColors.surfaceOf(context),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      hintText: "Search for an address",
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searching
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : IconButton(icon: const Icon(Icons.my_location), onPressed: _useCurrentLocation),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: AppColors.surfaceOf(context),
                    ),
                  ),
                ),
                if (_suggestions.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceOf(context),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
                    ),
                    child: Column(
                      children: _suggestions
                          .map((s) => ListTile(
                                dense: true,
                                leading: const Icon(Icons.location_on_outlined, color: AppColors.secondary),
                                title: Text(s.address, style: TextStyle(color: AppColors.textOf(context))),
                                onTap: () => _selectSuggestion(s),
                              ))
                          .toList(),
                    ),
                  ),
              ],
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: LoadingButton(
              label: "Confirm location",
              onPressed: _picked == null
                  ? null
                  : () async {
                      Navigator.of(context).pop(
                        LatLngResult(latitude: _picked!.latitude, longitude: _picked!.longitude, address: _address ?? _searchController.text),
                      );
                    },
            ),
          ),
        ],
      ),
    );
  }
}

class _GeocodeSuggestion {
  final String address;
  final double lat;
  final double lng;
  const _GeocodeSuggestion({required this.address, required this.lat, required this.lng});
}
