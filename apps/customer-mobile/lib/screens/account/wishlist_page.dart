import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _wishlistProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).users.wishlist());

class WishlistPage extends ConsumerWidget {
  const WishlistPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text("Wishlist")),
        body: EmptyState(
          icon: Icons.favorite_border,
          title: "Sign in to save vehicles",
          action: ElevatedButton(onPressed: () => context.push("/login"), child: const Text("Sign in")),
        ),
      );
    }

    final wishlistAsync = ref.watch(_wishlistProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Wishlist")),
      body: wishlistAsync.when(
        data: (items) => items.isEmpty
            ? const EmptyState(icon: Icons.favorite_border, title: "Your wishlist is empty")
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_wishlistProvider),
                child: GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.6,
                  ),
                  itemCount: items.length,
                  itemBuilder: (context, i) {
                    final entry = items[i];
                    return VehicleCard(
                      vehicle: entry.vehicle,
                      width: double.infinity,
                      isWishlisted: true,
                      onTap: () => context.push("/vehicle/${entry.vehicleId}"),
                      onWishlistToggle: () async {
                        await ref.read(marketplaceApiProvider).users.removeFromWishlist(entry.vehicleId);
                        ref.invalidate(_wishlistProvider);
                      },
                    );
                  },
                ),
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_wishlistProvider)),
      ),
    );
  }
}
