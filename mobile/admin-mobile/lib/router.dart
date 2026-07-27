import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import 'screens/approvals/approvals_hub_page.dart';
import 'screens/approvals/driving_license_approvals_page.dart';
import 'screens/approvals/partner_detail_page.dart';
import 'screens/approvals/partner_verifications_page.dart';
import 'screens/approvals/vehicle_approvals_page.dart';
import 'screens/audit/audit_logs_page.dart';
import 'screens/auth/forgot_password_page.dart';
import 'screens/auth/login_page.dart';
import 'screens/catalog/catalog_page.dart';
import 'screens/cms/cms_page.dart';
import 'screens/coupons/coupon_form_page.dart';
import 'screens/coupons/coupons_page.dart';
import 'screens/dashboard/dashboard_page.dart';
import 'screens/monetization/monetization_page.dart';
import 'screens/more/more_page.dart';
import 'screens/notifications/notifications_page.dart';
import 'screens/roles/roles_page.dart';
import 'screens/settings/settings_page.dart';
import 'screens/shell/main_shell.dart';
import 'screens/support/support_ticket_detail_page.dart';
import 'screens/support/support_tickets_page.dart';
import 'screens/transactions/transactions_page.dart';
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
      final loggingIn = state.matchedLocation == "/login" || state.matchedLocation == "/forgot-password";
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
          GoRoute(path: "/support", builder: (context, state) => const SupportTicketsPage()),
          GoRoute(path: "/more", builder: (context, state) => const MorePage()),
        ],
      ),
      GoRoute(path: "/coupons", builder: (context, state) => const CouponsPage()),
      GoRoute(path: "/login", builder: (context, state) => const LoginPage()),
      GoRoute(path: "/forgot-password", builder: (context, state) => const ForgotPasswordPage()),
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
      GoRoute(path: "/transactions", builder: (context, state) => const TransactionsPage()),
      GoRoute(path: "/audit-logs", builder: (context, state) => const AuditLogsPage()),
      GoRoute(path: "/roles", builder: (context, state) => const RolesPage()),
      GoRoute(path: "/catalog", builder: (context, state) => const CatalogPage()),
      GoRoute(path: "/cms", builder: (context, state) => const CmsAdminPage()),
      GoRoute(path: "/monetization", builder: (context, state) => const MonetizationPage()),
      GoRoute(path: "/settings", builder: (context, state) => const SettingsPage()),
      GoRoute(path: "/notifications", builder: (context, state) => const NotificationsPage()),
    ],
  );
});
