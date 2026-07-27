import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/cities/CitiesPage.tsx.
final _popularCitiesProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities(popular: true));

class CitiesPage extends ConsumerWidget {
  const CitiesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cities = ref.watch(_popularCitiesProvider);

    return HeroScaffold(
      eyebrow: "Marketplace Hubs",
      title: "Where We Operate",
      description: "We're live in Chennai today — expanding rapidly to new cities across the region.",
      slivers: [
        cities.when(
          data: (list) => list.isEmpty
              ? const SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: Icons.location_on_outlined,
                    title: "No popular cities marked yet",
                    message: "Check back soon — we're expanding to new cities regularly.",
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
                  sliver: SliverGrid.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 0.86,
                    ),
                    itemCount: list.length,
                    itemBuilder: (context, i) => _CityCard(
                      city: list[i],
                      onTap: () => context.push(
                        "/search?cityId=${list[i].id}&cityName=${Uri.encodeComponent(list[i].name)}",
                      ),
                    ),
                  ),
                ),
          loading: () => const SliverFillRemaining(hasScrollBody: false, child: SectionLoading()),
          error: (e, _) => SliverFillRemaining(
            hasScrollBody: false,
            child: ErrorView(message: "$e", onRetry: () => ref.invalidate(_popularCitiesProvider)),
          ),
        ),
      ],
    );
  }
}

class _CityCard extends StatelessWidget {
  final City city;
  final VoidCallback onTap;
  const _CityCard({required this.city, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final placeholder = Container(
      color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.primary100.withValues(alpha: 0.5),
      child: Icon(Icons.image_not_supported_outlined, size: 26, color: AppColors.mutedTextOf(context)),
    );

    return AppCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (city.imageUrl != null && city.imageUrl!.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: city.imageUrl!,
                    fit: BoxFit.cover,
                    errorWidget: (_, _, _) => placeholder,
                    placeholder: (_, _) => placeholder,
                  )
                else
                  placeholder,
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black.withValues(alpha: 0.55), Colors.transparent],
                    ),
                  ),
                ),
                Positioned(
                  left: 10,
                  bottom: 10,
                  right: 10,
                  child: Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: AppColors.accent),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          city.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Explore Vehicles",
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.mutedTextOf(context)),
                ),
                const Icon(Icons.arrow_forward, size: 14, color: AppColors.secondary),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
