import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/partner-web/src/screens/vehicles/VehicleDetailPage.tsx — the
/// per-vehicle console: images, insurance & policies, maintenance blocking, and
/// the pricing/spec summary, plus edit and deactivate actions.
///
/// Image *uploading* stays on the existing `/vehicles/:id/images` screen, which
/// already owns the picker and upload flow; this page links to it rather than
/// duplicating that machinery.
final _vehicleProvider = FutureProvider.autoDispose.family<Vehicle, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).vehicles.byId(id),
);

class VehicleDetailPage extends ConsumerWidget {
  final String vehicleId;
  const VehicleDetailPage({super.key, required this.vehicleId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehicle = ref.watch(_vehicleProvider(vehicleId));

    return Scaffold(
      appBar: AppBar(
        title: const Text("Vehicle"),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: "Edit",
            onPressed: () => context.push("/vehicles/$vehicleId/edit"),
          ),
        ],
      ),
      body: vehicle.when(
        data: (v) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(_vehicleProvider(vehicleId)),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _Header(vehicle: v),
              const SizedBox(height: 16),
              _ImagesCard(vehicle: v, onChanged: () => ref.invalidate(_vehicleProvider(vehicleId))),
              const SizedBox(height: 12),
              _PricingCard(vehicle: v),
              const SizedBox(height: 12),
              _InsuranceCard(vehicle: v),
              const SizedBox(height: 12),
              _BlockDatesCard(vehicleId: vehicleId),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.danger,
                  side: const BorderSide(color: AppColors.danger),
                  minimumSize: const Size(double.infinity, 48),
                ),
                onPressed: () => _confirmDeactivate(context, ref),
                icon: const Icon(Icons.block, size: 18),
                label: const Text("Deactivate vehicle"),
              ),
            ],
          ),
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_vehicleProvider(vehicleId))),
      ),
    );
  }

  Future<void> _confirmDeactivate(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Deactivate this vehicle?"),
        content: const Text("It will no longer be bookable. Existing bookings are unaffected."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text("Deactivate"),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(marketplaceApiProvider).vehicles.deactivate(vehicleId);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Vehicle deactivated")));
      context.go("/vehicles");
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _Header extends StatelessWidget {
  final Vehicle vehicle;
  const _Header({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                "${vehicle.brand?.name ?? ''} ${vehicle.model} (${vehicle.year})".trim(),
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
              ),
            ),
            const SizedBox(width: 10),
            StatusBadge.approval(vehicle.approvalStatus),
          ],
        ),
        const SizedBox(height: 5),
        Text(
          [vehicle.registrationNumber, vehicle.city?.name].nonNulls.join(" · "),
          style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context)),
        ),
        if (vehicle.approvalStatus == VehicleApprovalStatus.rejected && vehicle.rejectionReason != null) ...[
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.isDark(context) ? AppColors.dangerBgDark : AppColors.dangerBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              "Rejection reason: ${vehicle.rejectionReason}",
              style: TextStyle(
                fontSize: 12.5,
                height: 1.5,
                color: AppColors.isDark(context) ? AppColors.dangerTextDark : AppColors.dangerText,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _ImagesCard extends ConsumerWidget {
  final Vehicle vehicle;
  final VoidCallback onChanged;
  const _ImagesCard({required this.vehicle, required this.onChanged});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final images = vehicle.images;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  "Images",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                ),
              ),
              TextButton.icon(
                onPressed: () => context.push("/vehicles/${vehicle.id}/images"),
                icon: const Icon(Icons.add_photo_alternate_outlined, size: 17),
                label: const Text("Manage"),
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (images.isEmpty)
            Text("No images uploaded yet.", style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context)))
          else
            SizedBox(
              height: 96,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (context, i) => _ImageThumb(
                  image: images[i],
                  onDelete: () => _deleteImage(context, ref, images[i].id),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _deleteImage(BuildContext context, WidgetRef ref, String imageId) async {
    try {
      await ref.read(marketplaceApiProvider).vehicles.deleteImage(vehicle.id, imageId);
      onChanged();
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _ImageThumb extends StatelessWidget {
  final VehicleImage image;
  final VoidCallback onDelete;
  const _ImageThumb({required this.image, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        children: [
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: image.url,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => Container(
                  color: AppColors.subtleFillOf(context),
                  child: Icon(Icons.broken_image_outlined, color: AppColors.mutedTextOf(context)),
                ),
              ),
            ),
          ),
          if (image.isPrimary)
            const Positioned(left: 4, top: 4, child: StatusBadge(label: "Primary", tone: BadgeTone.info)),
          Positioned(
            right: 2,
            top: 2,
            child: Material(
              color: Colors.black.withValues(alpha: 0.6),
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onDelete,
                child: const Padding(
                  padding: EdgeInsets.all(5),
                  child: Icon(Icons.delete_outline, size: 15, color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PricingCard extends StatelessWidget {
  final Vehicle vehicle;
  const _PricingCard({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Pricing & specs",
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
          ),
          const SizedBox(height: 14),
          _Row(label: "Per hour", value: formatCurrency(vehicle.pricePerHour, precise: true)),
          _Row(label: "Per day", value: formatCurrency(vehicle.pricePerDay, precise: true)),
          _Row(label: "Security deposit", value: formatCurrency(vehicle.securityDeposit, precise: true)),
          const SizedBox(height: 10),
          _Row(label: "Seats", value: "${vehicle.seatingCapacity}"),
          _Row(label: "Transmission", value: vehicle.transmission.label),
          _Row(label: "Fuel", value: vehicle.fuelType.label),
          const SizedBox(height: 10),
          Divider(height: 1, color: AppColors.borderOf(context)),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Rating", style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context))),
              Row(
                children: [
                  StarRatingDisplay(rating: vehicle.averageRating, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    "${vehicle.averageRating.toStringAsFixed(1)} (${vehicle.totalReviews})",
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textOf(context)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  const _Row({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context))),
          Text(
            value,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textOf(context)),
          ),
        ],
      ),
    );
  }
}

class _InsuranceCard extends StatelessWidget {
  final Vehicle vehicle;
  const _InsuranceCard({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user_outlined, size: 16, color: AppColors.secondary),
              const SizedBox(width: 8),
              Text(
                "Insurance & policies",
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            vehicle.insuranceDetails?.isNotEmpty == true
                ? vehicle.insuranceDetails!
                : "No insurance details added.",
            style: TextStyle(fontSize: 13, height: 1.55, color: AppColors.mutedTextOf(context)),
          ),
          if (vehicle.rentalPolicies?.isNotEmpty == true) ...[
            const SizedBox(height: 10),
            Text(
              vehicle.rentalPolicies!,
              style: TextStyle(fontSize: 13, height: 1.55, color: AppColors.mutedTextOf(context)),
            ),
          ],
        ],
      ),
    );
  }
}

class _BlockDatesCard extends ConsumerStatefulWidget {
  final String vehicleId;
  const _BlockDatesCard({required this.vehicleId});

  @override
  ConsumerState<_BlockDatesCard> createState() => _BlockDatesCardState();
}

class _BlockDatesCardState extends ConsumerState<_BlockDatesCard> {
  DateTime? _start;
  DateTime? _end;
  final _reason = TextEditingController();

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _pick({required bool isStart}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? (_start ?? now) : (_end ?? _start ?? now),
      // End can't precede start, matching the web input's `min={blockStart}`.
      firstDate: isStart ? now : (_start ?? now),
      lastDate: now.add(const Duration(days: 730)),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _start = picked;
        if (_end != null && _end!.isBefore(picked)) _end = null;
      } else {
        _end = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (_start == null || _end == null) return;
    try {
      await ref.read(marketplaceApiProvider).vehicles.blockAvailability(
            widget.vehicleId,
            _start!,
            _end!,
            reason: _reason.text.trim().isEmpty ? null : _reason.text.trim(),
          );
      if (!mounted) return;
      setState(() {
        _start = null;
        _end = null;
      });
      _reason.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Dates blocked for maintenance")),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Could not block dates: ${e.message}")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.event_busy_outlined, size: 16, color: AppColors.secondary),
              const SizedBox(width: 8),
              Text(
                "Block dates for maintenance",
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _DateField(
                  label: "Start date",
                  value: _start,
                  onTap: () => _pick(isStart: true),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _DateField(
                  label: "End date",
                  value: _end,
                  onTap: _start == null ? null : () => _pick(isStart: false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reason,
            decoration: const InputDecoration(labelText: "Reason (optional)"),
          ),
          const SizedBox(height: 14),
          LoadingButton(
            label: "Block dates",
            onPressed: _start == null || _end == null ? null : _submit,
          ),
        ],
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  final String label;
  final DateTime? value;
  final VoidCallback? onTap;
  const _DateField({required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: InputDecorator(
        decoration: InputDecoration(labelText: label, enabled: onTap != null),
        child: Text(
          value == null ? "Select" : formatDate(value!),
          style: TextStyle(
            fontSize: 14,
            color: value == null ? AppColors.mutedTextOf(context) : AppColors.textOf(context),
          ),
        ),
      ),
    );
  }
}
