import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/marketplace_api.dart';
import '../models/enums.dart';
import 'auth_controller.dart';
import 'auth_state.dart';
import 'firebase_auth_service.dart';

/// Every one of these must be overridden in the app's `ProviderScope` —
/// [marketplaceApiProvider] with the app's API base URL, [allowedUserTypesProvider]
/// with which account types may hold a session in that app (customer-mobile
/// only allows CUSTOMER, etc.), mirroring `AuthProvider.allowedUserTypes` on web.
final marketplaceApiProvider = Provider<MarketplaceApi>((ref) {
  throw UnimplementedError("Override marketplaceApiProvider in main.dart with the app's API base URL");
});

final allowedUserTypesProvider = Provider<List<UserType>>((ref) {
  throw UnimplementedError("Override allowedUserTypesProvider in main.dart");
});

final firebaseAuthServiceProvider = Provider<FirebaseAuthService>((ref) => FirebaseAuthService());

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(
    api: ref.watch(marketplaceApiProvider),
    authService: ref.watch(firebaseAuthServiceProvider),
    allowedUserTypes: ref.watch(allowedUserTypesProvider),
  );
});
