import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_exception.dart';
import '../api/marketplace_api.dart';
import '../models/enums.dart';
import 'auth_state.dart';
import 'firebase_auth_service.dart';

/// Mirrors packages/api-client/src/context/AuthContext.tsx: a brand-new
/// Firebase sign-up has no local profile row yet, so `/auth/me` 404s until
/// `/auth/sync` creates one. [registerWithEmail] primes [_pendingSync] so the
/// listener's first `/auth/me` 404 knows to call `/auth/sync` instead of
/// treating it as "no account" — an ordinary sign-in that 404s (e.g. an
/// unrecognized phone number Firebase happily signed in as a new user) must
/// NOT auto-create a profile.
class AuthController extends StateNotifier<AuthState> {
  final MarketplaceApi api;
  final FirebaseAuthService authService;
  final List<UserType> allowedUserTypes;

  Map<String, dynamic>? _pendingSync;
  StreamSubscription? _sub;
  Future<void>? _inFlight;

  AuthController({required this.api, required this.authService, required this.allowedUserTypes})
      : super(const AuthState.loading()) {
    api.client.idTokenProvider = () => authService.getIdToken();
    api.client.onUnauthorized = () {
      if (state.status == AuthStatus.authenticated) unawaited(_signOutLocally());
    };
    _sub = authService.authStateChanges().listen((firebaseUser) {
      if (firebaseUser == null) {
        state = const AuthState.unauthenticated();
        return;
      }
      unawaited(_loadProfile());
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _loadProfile() {
    final existing = _inFlight;
    if (existing != null) return existing;
    final future = _doLoadProfile();
    _inFlight = future;
    return future.whenComplete(() => _inFlight = null);
  }

  Future<void> _doLoadProfile() async {
    try {
      final user = await api.auth.me();
      if (!allowedUserTypes.contains(user.userType)) {
        await authService.signOut();
        state = const AuthState.wrongRole();
        return;
      }
      state = AuthState.authenticated(user);
    } on ApiException catch (e) {
      if (e.statusCode != 404) {
        state = AuthState(status: AuthStatus.unauthenticated, error: e.message);
        return;
      }
      final pending = _pendingSync;
      if (pending == null) {
        state = const AuthState.unauthenticated();
        return;
      }
      _pendingSync = null;
      try {
        final user = await api.auth.sync(
          firstName: pending["firstName"] as String?,
          lastName: pending["lastName"] as String?,
          phone: pending["phone"] as String?,
          userType: (pending["userType"] as String?) ?? "CUSTOMER",
          referralCode: pending["referralCode"] as String?,
        );
        if (!allowedUserTypes.contains(user.userType)) {
          await authService.signOut();
          state = const AuthState.wrongRole();
          return;
        }
        state = AuthState.authenticated(user);
      } on ApiException catch (err) {
        state = AuthState(status: AuthStatus.unauthenticated, error: err.message);
      }
    }
  }

  Future<void> _signOutLocally() async {
    await authService.signOut();
    state = const AuthState.unauthenticated();
  }

  Future<void> loginWithEmail(String email, String password) async {
    await authService.signInWithEmail(email, password);
    await _loadProfile();
    if (state.status == AuthStatus.wrongRole) {
      throw ApiException("This account type cannot access this app.");
    }
    if (state.status != AuthStatus.authenticated) {
      throw ApiException(state.error ?? "Couldn't complete sign-in. Check your connection and try again.");
    }
  }

  Future<void> registerWithEmail({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
    String? phone,
    String userType = "CUSTOMER",
    String? referralCode,
  }) async {
    _pendingSync = {
      "firstName": firstName,
      "lastName": lastName,
      "phone": phone,
      "userType": userType,
      "referralCode": referralCode,
    };
    await authService.signUpWithEmail(email, password);
    await _loadProfile();
    if (state.status == AuthStatus.wrongRole) {
      throw ApiException("This account type cannot access this app.");
    }
    if (state.status != AuthStatus.authenticated) {
      throw ApiException(state.error ?? "Couldn't complete account creation. Check your connection and try again.");
    }
  }

  /// For the phone-first sign-in path: after Firebase phone sign-in
  /// succeeds, explicitly syncs the profile (used when the number is brand
  /// new, i.e. registering via phone rather than email).
  Future<void> completeSync({
    String? firstName,
    String? lastName,
    String? phone,
    String userType = "CUSTOMER",
    String? referralCode,
  }) async {
    final user = await api.auth.sync(
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      userType: userType,
      referralCode: referralCode,
    );
    if (!allowedUserTypes.contains(user.userType)) {
      await authService.signOut();
      state = const AuthState.wrongRole();
      throw ApiException("This account type cannot access this app.");
    }
    state = AuthState.authenticated(user);
  }

  Future<void> refresh() => _loadProfile();

  Future<void> logout() => _signOutLocally();

  Future<void> sendPasswordResetEmail(String email) => authService.sendPasswordResetEmail(email);
}
