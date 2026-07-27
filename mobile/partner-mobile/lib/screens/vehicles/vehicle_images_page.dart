import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_core/mobile_core.dart';

final _vehicleProvider = FutureProvider.autoDispose.family<Vehicle, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).vehicles.byId(id),
);

class VehicleImagesPage extends ConsumerStatefulWidget {
  final String vehicleId;
  const VehicleImagesPage({super.key, required this.vehicleId});

  @override
  ConsumerState<VehicleImagesPage> createState() => _VehicleImagesPageState();
}

class _VehicleImagesPageState extends ConsumerState<VehicleImagesPage> {
  bool _uploading = false;

  Future<void> _pickAndUpload() async {
    final files = await ImagePicker().pickMultiImage(imageQuality: 80);
    if (files.isEmpty) return;
    setState(() => _uploading = true);
    try {
      final images = <Map<String, dynamic>>[];
      for (final file in files) {
        final bytes = await File(file.path).readAsBytes();
        images.add({"url": bytesToDataUrl(bytes, mimeType: mimeTypeForPath(file.path))});
      }
      await ref.read(marketplaceApiProvider).vehicles.addImages(widget.vehicleId, images);
      ref.invalidate(_vehicleProvider(widget.vehicleId));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _delete(String imageId) async {
    await ref.read(marketplaceApiProvider).vehicles.deleteImage(widget.vehicleId, imageId);
    ref.invalidate(_vehicleProvider(widget.vehicleId));
  }

  @override
  Widget build(BuildContext context) {
    final vehicleAsync = ref.watch(_vehicleProvider(widget.vehicleId));
    return Scaffold(
      appBar: AppBar(title: const Text("Vehicle images")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _uploading ? null : _pickAndUpload,
        icon: const Icon(Icons.add_photo_alternate_outlined),
        label: Text(_uploading ? "Uploading…" : "Add images"),
      ),
      body: vehicleAsync.when(
        data: (vehicle) => vehicle.images.isEmpty
            ? const EmptyState(icon: Icons.photo_library_outlined, title: "No images yet")
            : GridView.builder(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 96),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 1),
                itemCount: vehicle.images.length,
                itemBuilder: (context, i) {
                  final image = vehicle.images[i];
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: CachedNetworkImage(imageUrl: image.url, fit: BoxFit.cover),
                      ),
                      if (image.isPrimary)
                        const Positioned(top: 6, left: 6, child: StatusBadge(label: "Primary", tone: BadgeTone.info)),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.white),
                          style: IconButton.styleFrom(backgroundColor: Colors.black45),
                          onPressed: () => _delete(image.id),
                        ),
                      ),
                    ],
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_vehicleProvider(widget.vehicleId))),
      ),
    );
  }
}
