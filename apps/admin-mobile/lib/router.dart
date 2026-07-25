import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import 'screens/approvals/approvals_hub_page.dart';
import 'screens/approvals/driving_license_approvals_page.dart';
import 'screens/approvals/partner_detail_page.dart';
import 'screens/approvals/partner_verifications_page.dart';
import 'screens/approvals/vehicle_approvals_page.dart';
import 'screens/auth/login_page.dart';
import 'screens/coupons/coupon_form_page.dart';
import 'screens/coupons/coupons_page.dart';
import 'screens/dashboard/dashboard_page.dart';
import 'screens/shell/main_shell.dart';
import 'screens/support/support_ticket_detail_page.dart';
import 'screens/support/support_tickets_page.dart';
import 'screens/users/user_detail_page.dart';
import 'screens/users/users_page.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.status != next.status) notifyListeners();
    });
  }
}

final adminRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefreshNotifier(ref);

  return GoRouter(
    initialLocation: "/",
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loggingIn = state.matchedLocation == "/login";
      if (auth.status == AuthStatus.loading) return null;
      if (!auth.isAuthenticated) return loggingIn ? null : "/login";
      if (auth.isAuthenticated && loggingIn) return "/";
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: "/", builder: (context, state) => const DashboardPage()),
          GoRoute(path: "/approvals", builder: (context, state) => const ApprovalsHubPage()),
          GoRoute(path: "/users", builder: (context, state) => const UsersPage()),
          GoRoute(path: "/coupons", builder: (context, state) => const CouponsPage()),
          GoRoute(path: "/support", builder: (context, state) => const SupportTicketsPage()),
        ],
      ),
      GoRoute(path: "/login", builder: (context, state) => const LoginPage()),
      GoRoute(path: "/approvals/vehicles", builder: (context, state) => const VehicleApprovalsPage()),
      GoRoute(path: "/approvals/partners", builder: (context, state) => const PartnerVerificationsPage()),
      GoRoute(
        path: "/approvals/partners/:id",
        builder: (context, state) => PartnerDetailPage(partnerId: state.pathParameters["id"]!),
      ),
      GoRoute(path: "/approvals/licenses", builder: (context, state) => const DrivingLicenseApprovalsPage()),
      GoRoute(
        path: "/users/:id",
        builder: (context, state) => UserDetailPage(userId: state.pathParameters["id"]!),
      ),
      GoRoute(path: "/coupons/new", builder: (context, state) => const CouponFormPage()),
      GoRoute(
        path: "/coupons/:id/edit",
        builder: (context, state) => CouponFormPage(couponId: state.pathParameters["id"]),
      ),
      GoRoute(
        path: "/support/:id",
        builder: (context, state) => SupportTicketDetailPage(ticketId: state.pathParameters["id"]!),
      ),
    ],
  );
});
