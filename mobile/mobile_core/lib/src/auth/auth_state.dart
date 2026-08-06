import '../models/user.dart';

enum AuthStatus { loading, unauthenticated, wrongRole, authenticated }

class AuthState {
  final AuthStatus status;
  final AppUser? user;
  final String? error;

  const AuthState({required this.status, this.user, this.error});

  const AuthState.loading() : this(status: AuthStatus.loading);
  const AuthState.unauthenticated() : this(status: AuthStatus.unauthenticated);
  const AuthState.wrongRole() : this(status: AuthStatus.wrongRole);
  const AuthState.authenticated(AppUser user) : this(status: AuthStatus.authenticated, user: user);

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;
}
