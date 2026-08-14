import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Mirrors apps/public-site/src/screens/home/HomePage.tsx section for section:
/// search widget + hero slider, trust strip, categories, featured vehicles,
/// partner hubs, sponsored placements, how it works, why choose us,
/// testimonials, stats band, app perks, FAQ, newsletter.
final _citiesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.cities(popular: true));
final _categoriesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleCategories());
final _featuredProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(marketplaceApiProvider).vehicles.search(const VehicleSearchFilters(sortBy: "rating"), limit: 10),
);

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  String? _cityId;
  String? _categoryId;

  /// The web search widget carries the chosen city/category into /search as
  /// query params; the mobile search screen reads the same ones.
  void _submitSearch() {
    final params = <String, String>{};
    if (_cityId != null) params["cityId"] = _cityId!;
    if (_categoryId != null) params["categoryId"] = _categoryId!;
    final query = params.entries.map((e) => "${e.key}=${Uri.encodeComponent(e.value)}").join("&");
    context.push(query.isEmpty ? "/search" : "/search?$query");
  }

  @override
  Widget build(BuildContext context) {
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
          ref.invalidate(heroBannersProvider);
          ref.invalidate(affiliatePartnersProvider);
          ref.invalidate(adSlotsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── SECTION 1: hero slider + search widget ───────────────────
              // Web splits these side by side (400px search box | slider); a
              // phone stacks them, slider on top so the search box stays in
              // thumb reach.
              // Order matches the web at mobile width: the hero grid is
              // `lg:grid-cols-[400px_1fr]`, so below `lg` it collapses to one
              // column with the search box first and the slider beneath it.
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: _SearchWidget(
                  cities: cities,
                  categories: categories,
                  cityId: _cityId,
                  categoryId: _categoryId,
                  onCityChanged: (v) => setState(() => _cityId = v),
                  onCategoryChanged: (v) => setState(() => _categoryId = v),
                  onSubmit: _submitSearch,
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: HeroSlider(onCtaTap: _handleCta),
                ),
              ),
              const SizedBox(height: 32),

              // ── SECTION 2: popular categories ────────────────────────────
              const _Section(
                eyebrow: "Browse Fleet",
                title: "Popular Categories",
                subtitle: "Find the perfect ride tailored for daily commutes, weekend getaways, or luxury tours.",
              ),
              SizedBox(
                height: 96,
                child: categories.when(
                  data: (list) => list.isEmpty
                      ? _inlineNote(context, "No categories published yet.")
                      : ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: list.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 12),
                          itemBuilder: (context, i) => _CategoryChip(
                            category: list[i],
                            onTap: () => context.push(
                              "/search?categoryId=${list[i].id}&categoryName=${Uri.encodeComponent(list[i].name)}",
                            ),
                          ),
                        ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => _inlineNote(context, "$e"),
                ),
              ),
              const SizedBox(height: 32),

              // ── SECTION 2B: popular cities ───────────────────────────────
              const _Section(
                eyebrow: "Popular Locations",
                title: "Cities We Cover",
                subtitle: "Pick a neighbourhood and see everything available there right now.",
              ),
              SizedBox(
                height: 94,
                child: cities.when(
                  data: (list) => list.isEmpty
                      ? _inlineNote(context, "No cities published yet.")
                      : ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: list.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 12),
                          itemBuilder: (context, i) => _CityChip(
                            city: list[i],
                            onTap: () => context.push(
                              "/search?cityId=${list[i].id}&cityName=${Uri.encodeComponent(list[i].name)}",
                            ),
                          ),
                        ),
                  loading: () => const SectionLoading(),
                  error: (e, _) => _inlineNote(context, "$e"),
                ),
              ),
              const SizedBox(height: 32),

              // ── SECTION 3: featured vehicles ─────────────────────────────
              _Section(
                eyebrow: "Top Rated Rides",
                title: "Featured Vehicles",
                subtitle: "Verified condition, sanitized rides from our trusted local rental partners.",
                action: TextButton(
                  onPressed: () => context.push("/search"),
                  child: const Text("See all"),
                ),
              ),
              featured.when(
                data: (page) => page.items.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: EmptyState(
                          icon: Icons.search_off,
                          title: "No featured vehicles available",
                          message: "Our partners are onboarding new vehicles daily — browse full search to check all listings.",
                        ),
                      )
                    : SizedBox(
                        height: 302,
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
                error: (e, _) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ErrorView(message: "$e", onRetry: () => ref.invalidate(_featuredProvider)),
                ),
              ),
              const SizedBox(height: 32),

              // ── SECTION 4: partner hubs ──────────────────────────────────
              const _Section(
                eyebrow: "Marketplace Partners",
                title: "Popular Rental Hubs",
                subtitle: "Verified local rental businesses serving customers across Chennai.",
              ),
              SizedBox(
                height: 84,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: MarketingContent.partnerHubs.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, i) => _PartnerHubCard(hub: MarketingContent.partnerHubs[i]),
                ),
              ),
              const SizedBox(height: 32),

              // ── SECTION 4B/4C: sponsored placements ──────────────────────
              // Both collapse to nothing when the admin's monetization toggles
              // are off, so no spacer is wasted on an empty band.
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Column(children: [SponsoredBanner(), SizedBox(height: 12), AdSlotsBand()]),
              ),

              // ── SECTION 5: how it works ──────────────────────────────────
              _Band(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SectionHeading(
                      eyebrow: "Simple Process",
                      title: "How RentWheels Works",
                      subtitle: "From instant search to smooth returns in five simple steps.",
                      centered: true,
                    ),
                    const SizedBox(height: 28),
                    const HowItWorksSection(),
                  ],
                ),
              ),

              // ── SECTION 6: why choose us ─────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 36, 16, 0),
                child: Column(
                  children: [
                    const SectionHeading(eyebrow: "Why RentWheels", title: "Why Choose RentWheels", centered: true),
                    const SizedBox(height: 22),
                    const WhyChooseUsSection(),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── SECTION 7: testimonials ──────────────────────────────────
              _Band(
                horizontalPadding: 0,
                child: Column(
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20),
                      child: SectionHeading(eyebrow: "Verified Reviews", title: "What Renters Say", centered: true),
                    ),
                    const SizedBox(height: 22),
                    const TestimonialsSection(),
                  ],
                ),
              ),

              // ── SECTION 8: stats band ────────────────────────────────────
              const StatsBand(),

              // ── SECTION 9: app perks ─────────────────────────────────────
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 32, 16, 0),
                child: AppPerksCard(),
              ),

              // ── SECTION 10: FAQ ──────────────────────────────────────────
              _Band(
                child: Column(
                  children: [
                    const SectionHeading(eyebrow: "Questions", title: "Frequently Asked Questions", centered: true),
                    const SizedBox(height: 20),
                    const FaqAccordion(items: MarketingContent.faqItems),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.push("/support"),
                      child: const Text("Still stuck? Contact support"),
                    ),
                  ],
                ),
              ),

              // ── NEWSLETTER ───────────────────────────────────────────────
              const NewsletterBanner(),
            ],
          ),
        ),
      ),
    );
  }

  /// Hero banner CTAs are admin-authored. In-app paths route internally;
  /// anything else is an external campaign link and opens in the browser.
  void _handleCta(String url) {
    if (url.startsWith("/")) {
      context.push(url);
    } else {
      launchExternalUrl(url);
    }
  }
}

Widget _inlineNote(BuildContext context, String text) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(text, style: TextStyle(fontSize: 13, color: AppColors.mutedTextOf(context))),
    );

/// The tinted full-width band the web uses to separate marketing sections
/// (`bg-primary-50/50 dark:bg-white/[0.02]`).
class _Band extends StatelessWidget {
  final Widget child;
  final double horizontalPadding;
  const _Band({required this.child, this.horizontalPadding = 20});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 32),
      padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 32),
      color: AppColors.isDark(context) ? Colors.white.withValues(alpha: 0.02) : AppColors.primary50.withValues(alpha: 0.5),
      child: child,
    );
  }
}

class _Section extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String? subtitle;
  final Widget? action;
  const _Section({required this.eyebrow, required this.title, this.subtitle, this.action});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: SectionHeading(eyebrow: eyebrow, title: title, subtitle: subtitle, action: action),
    );
  }
}

/// The persistent search box from the web hero: city + category selects and a
/// full-width submit, over a trust strip.
class _SearchWidget extends StatelessWidget {
  final AsyncValue<List<City>> cities;
  final AsyncValue<List<VehicleCategory>> categories;
  final String? cityId;
  final String? categoryId;
  final ValueChanged<String?> onCityChanged;
  final ValueChanged<String?> onCategoryChanged;
  final VoidCallback onSubmit;

  const _SearchWidget({
    required this.cities,
    required this.categories,
    required this.cityId,
    required this.categoryId,
    required this.onCityChanged,
    required this.onCategoryChanged,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Decorative vehicle-type row above the divider. These are plain
          // `<span>`s on the web too (HomePage.tsx SECTION 1) — they label the
          // marketplace's scope rather than filter anything, so they are not
          // made tappable here either.
          Wrap(
            spacing: 14,
            runSpacing: 8,
            children: const [
              _TypeChip(icon: Icons.directions_car_filled_outlined, label: "All Vehicles"),
              _TypeChip(icon: Icons.directions_car_filled_outlined, label: "Cars"),
              _TypeChip(icon: Icons.two_wheeler, label: "Bikes & Scooters"),
              _TypeChip(icon: Icons.auto_awesome_outlined, label: "Luxury Rides"),
            ],
          ),
          const SizedBox(height: 14),
          Divider(height: 1, color: AppColors.borderOf(context)),
          const SizedBox(height: 16),
          const Eyebrow(text: "Best rental deals"),
          const SizedBox(height: 10),
          Text(
            "Book Self-Drive Vehicles Across Chennai",
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19, height: 1.2, color: AppColors.textOf(context)),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: cityId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: "City", hintText: "Choose city..."),
            items: [
              const DropdownMenuItem(value: null, child: Text("Any city")),
              ...?cities.valueOrNull?.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
            ],
            onChanged: onCityChanged,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: categoryId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: "Vehicle category", hintText: "Choose category..."),
            items: [
              const DropdownMenuItem(value: null, child: Text("Any category")),
              ...?categories.valueOrNull?.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
            ],
            onChanged: onCategoryChanged,
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onSubmit,
              icon: const Icon(Icons.search, size: 18),
              label: const Text("Search Available Rides"),
            ),
          ),
          const SizedBox(height: 16),
          Divider(height: 1, color: AppColors.borderOf(context)),
          const SizedBox(height: 12),
          const TrustStrip(),
        ],
      ),
    );
  }
}

/// One entry in the search card's vehicle-type row: `text-xs font-bold` with a
/// 14px leading icon, matching the web's `flex items-center gap-1.5`.
class _TypeChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TypeChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.isDark(context) ? AppColors.primary300 : AppColors.primary600;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
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
    return SizedBox(
      width: 90,
      child: AppCard(
        padding: const EdgeInsets.all(10),
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconTile(
              icon: Icons.location_city,
              background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
              foreground: isDark ? AppColors.infoTextDark : AppColors.secondary,
              size: 36,
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
    return SizedBox(
      width: 96,
      child: AppCard(
        padding: const EdgeInsets.all(10),
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconTile(
              icon: categoryIcon(category.name),
              background: isDark ? AppColors.accentBgDark : AppColors.accent100,
              foreground: isDark ? AppColors.accentTextDark : AppColors.accent600,
              size: 36,
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
    );
  }
}

class _PartnerHubCard extends StatelessWidget {
  final PartnerHub hub;
  const _PartnerHubCard({required this.hub});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    return SizedBox(
      width: 232,
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            IconTile(
              icon: Icons.verified_user_outlined,
              background: isDark ? AppColors.accentBgDark : AppColors.accent100,
              foreground: isDark ? AppColors.accentTextDark : AppColors.accent600,
              size: 42,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    hub.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                  ),
                  Text("${hub.city} Hub", style: TextStyle(fontSize: 11, color: AppColors.mutedTextOf(context))),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 12, color: Color(0xFFF59E0B)),
                      const SizedBox(width: 3),
                      Text(
                        "${hub.rating}",
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD97706)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
