import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import 'providers/partner_profile_provider.dart';
import 'screens/auth/forgot_password_page.dart';
import 'screens/auth/login_page.dart';
import 'screens/auth/register_page.dart';
import 'screens/bookings/partner_booking_detail_page.dart';
import 'screens/bookings/partner_bookings_page.dart';
import 'screens/dashboard/dashboard_page.dart';
import 'screens/onboarding/bank_details_page.dart';
import 'screens/onboarding/business_profile_form_page.dart';
import 'screens/onboarding/documents_page.dart';
import 'screens/profile/business_profile_page.dart';
import 'screens/reviews/partner_reviews_page.dart';
import 'screens/shell/main_shell.dart';
import 'screens/support/partner_support_ticket_detail_page.dart';
import 'screens/support/partner_support_tickets_page.dart';
import 'screens/vehicles/my_vehicles_page.dart';
import 'screens/vehicles/vehicle_form_page.dart';
import 'screens/vehicles/vehicle_images_page.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.status != next.status) notifyListeners();
    });
    ref.listen(partnerProfileProvider, (previous, next) {
      if (!next.isLoading) notifyListeners();
    });
  }
}

final partnerRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefreshNotifier(ref);

  return GoRouter(
    initialLocation: "/",
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loggingIn = state.matchedLocation == "/login" ||
          state.matchedLocation == "/register" ||
          state.matchedLocation == "/forgot-password";

      if (auth.status == AuthStatus.loading) return null;
      if (!auth.isAuthenticated) return loggingIn ? null : "/login";
      if (auth.isAuthenticated && loggingIn) return "/";

      final profileState = ref.read(partnerProfileProvider);
      if (profileState.isLoading) return null;
      final profile = profileState.asData?.value;
      final loc = state.matchedLocation;
      if (profile == null) {
        // Documents/bank-details need a partner id to attach to, so only the
        // profile-creation step is reachable until `/rental-partners/me` exists.
        return loc == "/onboarding/business" ? null : "/onboarding/business";
      }
      if (loc == "/onboarding/business") return "/"; // profile already created
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: "/", builder: (context, state) => const DashboardPage()),
          GoRoute(path: "/vehicles", builder: (context, state) => const MyVehiclesPage()),
          GoRoute(path: "/bookings", builder: (context, state) => const PartnerBookingsPage()),
          GoRoute(path: "/reviews", builder: (context, state) => const PartnerReviewsPage()),
          GoRoute(path: "/profile", builder: (context, state) => const BusinessProfilePage()),
        ],
      ),
      GoRoute(path: "/login", builder: (context, state) => const LoginPage()),
      GoRoute(path: "/register", builder: (context, state) => const RegisterPage()),
      GoRoute(path: "/forgot-password", builder: (context, state) => const ForgotPasswordPage()),
      GoRoute(path: "/onboarding/business", builder: (context, state) => const BusinessProfileFormPage()),
      GoRoute(path: "/onboarding/documents", builder: (context, state) => const DocumentsPage()),
      GoRoute(path: "/onboarding/bank-details", builder: (context, state) => const BankDetailsPage()),
      GoRoute(path: "/vehicles/new", builder: (context, state) => const VehicleFormPage()),
      GoRoute(
        path: "/vehicles/:id/edit",
        builder: (context, state) => VehicleFormPage(vehicleId: state.pathParameters["id"]),
      ),
      GoRoute(
        path: "/vehicles/:id/images",
        builder: (context, state) => VehicleImagesPage(vehicleId: state.pathParameters["id"]!),
      ),
      GoRoute(
        path: "/bookings/:id",
        builder: (context, state) => PartnerBookingDetailPage(bookingId: state.pathParameters["id"]!),
      ),
      GoRoute(path: "/support", builder: (context, state) => const PartnerSupportTicketsPage()),
      GoRoute(
        path: "/support/:id",
        builder: (context, state) => PartnerSupportTicketDetailPage(ticketId: state.pathParameters["id"]!),
      ),
      GoRoute(path: "/profile/documents", builder: (context, state) => const DocumentsPage()),
      GoRoute(path: "/profile/bank-details", builder: (context, state) => const BankDetailsPage()),
      GoRoute(path: "/profile/edit", builder: (context, state) => const BusinessProfileFormPage()),
    ],
  );
});
