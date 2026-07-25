import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _citiesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities(popular: true));
final _categoriesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleCategories());
final _featuredProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(marketplaceApiProvider).vehicles.search(const VehicleSearchFilters(sortBy: "rating"), limit: 10),
);

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final cities = ref.watch(_citiesProvider);
    final categories = ref.watch(_categoriesProvider);
    final featured = ref.watch(_featuredProvider);
    final isDark = AppColors.isDark(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.directions_car_filled, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Text("RentWheels", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19, color: AppColors.textOf(context))),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round_outlined, color: AppColors.mutedTextOf(context)),
            tooltip: isDark ? "Switch to light mode" : "Switch to dark mode",
            onPressed: () => ref.read(themeModeProvider.notifier).toggleTheme(),
          ),
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: AppColors.mutedTextOf(context)),
            onPressed: () => auth.isAuthenticated ? context.push("/account/notifications") : context.push("/login"),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_citiesProvider);
          ref.invalidate(_categoriesProvider);
          ref.invalidate(_featuredProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Banner Widget (Matching public-site search box)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surfaceOf(context),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.borderOf(context)),
                  boxShadow: AppShadows.soft,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Eyebrow badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.infoBgDark : AppColors.secondary100,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        "BEST RENTAL DEALS",
                        style: TextStyle(
                          color: isDark ? AppColors.infoTextDark : AppColors.secondary,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "Book Self-Drive Vehicles Across Chennai",
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.textOf(context), height: 1.2),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Search cars & bikes from verified local rental partners.",
                      style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context)),
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => context.push("/search"),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white : AppColors.primary900,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: AppShadows.soft,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search, color: isDark ? AppColors.primary900 : Colors.white, size: 20),
                            const SizedBox(width: 10),
                            Text(
                              "Search Available Rides",
                              style: TextStyle(
                                color: isDark ? AppColors.primary900 : Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Divider(height: 1, color: AppColors.borderOf(context)),
                    const SizedBox(height: 12),
                    // Trust Strip
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _TrustItem(icon: Icons.star, text: "4.9/5 Rating", iconColor: Color(0xFFF59E0B)),
                        _TrustItem(icon: Icons.verified_user, text: "Verified Partners", iconColor: AppColors.secondary),
                        _TrustItem(icon: Icons.flash_on, text: "Instant Pickups", iconColor: AppColors.accent600),
                      ],
                    ),
                  ],
                ),
              ),

              // Cities Rail
              const _SectionHeader(eyebrow: "POPULAR LOCATIONS", title: "Cities in Chennai"),
              SizedBox(
                height: 94,
                child: cities.when(
                  data: (list) => ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, i) => _CityChip(
                      city: list[i],
                      onTap: () => context.push("/search?cityId=${list[i].id}&cityName=${Uri.encodeComponent(list[i].name)}"),
                    ),
                  ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text("$e")),
                ),
              ),
              const SizedBox(height: 24),

              // Categories Grid
              const _SectionHeader(eyebrow: "BROWSE FLEET", title: "Popular Categories"),
              SizedBox(
                height: 96,
                child: categories.when(
                  data: (list) => ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, i) => _CategoryChip(
                      category: list[i],
                      onTap: () => context.push("/search?categoryId=${list[i].id}&categoryName=${Uri.encodeComponent(list[i].name)}"),
                    ),
                  ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text("$e")),
                ),
              ),
              const SizedBox(height: 24),

              // Featured Vehicles
              const _SectionHeader(eyebrow: "TOP RATED RIDES", title: "Featured Vehicles"),
              featured.when(
                data: (page) => page.items.isEmpty
                    ? const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text("No vehicles yet."))
                    : SizedBox(
                        height: 296,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: page.items.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 12),
                          itemBuilder: (context, i) => VehicleCard(
                            vehicle: page.items[i],
                            onTap: () => context.push("/vehicle/${page.items[i].id}"),
                          ),
                        ),
                      ),
                loading: () => const SectionLoading(),
                error: (e, _) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text("$e")),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String eyebrow;
  final String title;
  const _SectionHeader({required this.eyebrow, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(eyebrow, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.secondary, letterSpacing: 0.6)),
          const SizedBox(height: 2),
          Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context))),
        ],
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color iconColor;
  const _TrustItem({required this.icon, required this.text, required this.iconColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.mutedTextOf(context))),
      ],
    );
  }
}

class _CityChip extends StatelessWidget {
  final City city;
  final VoidCallback onTap;
  const _CityChip({required this.city, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return Container(
      width: 90,
      decoration: BoxDecoration(
        color: AppColors.surfaceOf(context),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderOf(context)),
        boxShadow: AppShadows.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.infoBgDark : AppColors.secondary50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.location_city, color: isDark ? AppColors.infoTextDark : AppColors.secondary, size: 20),
                ),
                const SizedBox(height: 8),
                Text(
                  city.name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textOf(context)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final VehicleCategory category;
  final VoidCallback onTap;
  const _CategoryChip({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return Container(
      width: 96,
      decoration: BoxDecoration(
        color: AppColors.surfaceOf(context),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderOf(context)),
        boxShadow: AppShadows.soft,
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.accentBgDark : AppColors.accent100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.directions_car_filled_outlined, color: isDark ? AppColors.accentTextDark : AppColors.accent600, size: 20),
                ),
                const SizedBox(height: 8),
                Text(
                  category.name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textOf(context)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
