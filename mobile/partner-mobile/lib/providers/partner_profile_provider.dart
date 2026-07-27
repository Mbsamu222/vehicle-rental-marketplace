import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Resolves to `null` when the signed-in partner hasn't completed onboarding
/// yet (`/rental-partners/me` 404s) rather than throwing — the router's
/// redirect and the dashboard both key off "no profile yet" as a normal state.
final partnerProfileProvider = FutureProvider<RentalPartner?>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isAuthenticated) return null;
  try {
    return await ref.watch(marketplaceApiProvider).rentalPartners.myProfile();
  } on ApiException catch (e) {
    if (e.isNotFound) return null;
    rethrow;
  }
});
