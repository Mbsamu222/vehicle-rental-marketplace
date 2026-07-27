import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/categories/CategoriesPage.tsx.
final _allCategoriesProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.vehicleCategories());

class CategoriesPage extends ConsumerWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(_allCategoriesProvider);
    final isDark = AppColors.isDark(context);

    return HeroScaffold(
      eyebrow: "Browse Fleet",
      title: "Vehicle Categories",
      description:
          "From compact hatchbacks and electric bikes to premium SUVs — find the right category for your next journey.",
      slivers: [
        categories.when(
          data: (list) => list.isEmpty
              ? const SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: Icons.grid_view_outlined,
                    title: "No categories available yet",
                    message: "Check back soon for newly listed categories.",
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
                  sliver: SliverGrid.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 0.92,
                    ),
                    itemCount: list.length,
                    itemBuilder: (context, i) {
                      final category = list[i];
                      return AppCard(
                        padding: const EdgeInsets.all(16),
                        onTap: () => context.push(
                          "/search?categoryId=${category.id}&categoryName=${Uri.encodeComponent(category.name)}",
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconTile(
                              icon: categoryIcon(category.name),
                              background: isDark ? AppColors.infoBgDark : AppColors.secondary50,
                              foreground: isDark ? AppColors.accentTextDark : AppColors.secondary,
                              size: 56,
                            ),
                            const SizedBox(height: 14),
                            Text(
                              category.name,
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textOf(context),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  "Browse Vehicles",
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.mutedTextOf(context),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.arrow_forward, size: 12, color: AppColors.mutedTextOf(context)),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
          loading: () => const SliverFillRemaining(hasScrollBody: false, child: SectionLoading()),
          error: (e, _) => SliverFillRemaining(
            hasScrollBody: false,
            child: ErrorView(message: "$e", onRetry: () => ref.invalidate(_allCategoriesProvider)),
          ),
        ),
      ],
    );
  }
}
