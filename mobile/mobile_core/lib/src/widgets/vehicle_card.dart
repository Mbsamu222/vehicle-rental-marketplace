import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../models/vehicle.dart';
import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';
import '../utils/formatters.dart';

/// Matches apps/public-site's VehicleCard.tsx: 16:10 image with a category
/// tag, wishlist toggle, and rating pill overlaid on it, a specs mini-grid,
/// and a footer pairing the price with a CTA button — reused everywhere a
/// vehicle appears (home rail, search results, wishlist) instead of each
/// screen rolling its own card.
class VehicleCard extends StatelessWidget {
  final Vehicle vehicle;
  final VoidCallback onTap;
  final bool? isWishlisted;
  final VoidCallback? onWishlistToggle;
  final double width;

  const VehicleCard({
    super.key,
    required this.vehicle,
    required this.onTap,
    this.isWishlisted,
    this.onWishlistToggle,
    this.width = 220,
  });

  @override
  Widget build(BuildContext context) {
    final muted = AppColors.mutedTextOf(context);
    return SizedBox(
      width: width,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceOf(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderOf(context).withValues(alpha: 0.8)),
          boxShadow: AppShadows.soft,
        ),
        clipBehavior: Clip.antiAlias,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _ImageArea(vehicle: vehicle, isWishlisted: isWishlisted, onWishlistToggle: onWishlistToggle),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        vehicle.model,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 13, color: muted),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              "${vehicle.city?.name ?? ''} · ${vehicle.year}",
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: muted),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(color: AppColors.borderOf(context)),
                        bottom: BorderSide(color: AppColors.borderOf(context)),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(child: _SpecCell(label: vehicle.transmission.label)),
                        const SizedBox(width: 6),
                        Expanded(child: _SpecCell(label: vehicle.fuelType.label)),
                        const SizedBox(width: 6),
                        Expanded(child: _SpecCell(label: "${vehicle.seatingCapacity} seats")),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 0, 10, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: formatCurrency(vehicle.pricePerDay),
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.secondary),
                              ),
                              TextSpan(
                                text: " / day",
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: muted),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(color: AppColors.primary900, borderRadius: BorderRadius.circular(10)),
                        child: const Text("View", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ImageArea extends StatelessWidget {
  final Vehicle vehicle;
  final bool? isWishlisted;
  final VoidCallback? onWishlistToggle;
  const _ImageArea({required this.vehicle, this.isWishlisted, this.onWishlistToggle});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 10,
      child: Stack(
        fit: StackFit.expand,
        children: [
          vehicle.primaryImageUrl != null
              ? CachedNetworkImage(imageUrl: vehicle.primaryImageUrl!, fit: BoxFit.cover)
              : Container(color: AppColors.primary100, child: const Icon(Icons.directions_car, size: 40, color: AppColors.primary300)),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x33000000), Colors.transparent],
                ),
              ),
            ),
          ),
          if (vehicle.category != null)
            Positioned(
              top: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: AppColors.surface.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(999)),
                child: Text(vehicle.category!.name, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ),
          if (onWishlistToggle != null)
            Positioned(
              top: 6,
              right: 6,
              child: InkWell(
                onTap: onWishlistToggle,
                customBorder: const CircleBorder(),
                child: Container(
                  width: 30,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: AppColors.surface.withValues(alpha: 0.9), shape: BoxShape.circle),
                  child: Icon(
                    isWishlisted == true ? Icons.favorite : Icons.favorite_border,
                    size: 16,
                    color: isWishlisted == true ? AppColors.danger : AppColors.primary600,
                  ),
                ),
              ),
            ),
          if (vehicle.totalReviews > 0)
            Positioned(
              bottom: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.65), borderRadius: BorderRadius.circular(999)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star, size: 12, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 3),
                    Text(vehicle.averageRating.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SpecCell extends StatelessWidget {
  final String label;
  const _SpecCell({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(color: AppColors.subtleFillOf(context), borderRadius: BorderRadius.circular(8)),
      child: Text(
        label,
        textAlign: TextAlign.center,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.mutedTextOf(context)),
      ),
    );
  }
}
