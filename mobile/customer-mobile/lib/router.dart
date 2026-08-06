import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import 'screens/account/account_page.dart';
import 'screens/account/driving_licenses_page.dart';
import 'screens/account/edit_profile_page.dart';
import 'screens/account/notifications_page.dart';
import 'screens/account/payments_page.dart';
import 'screens/account/saved_locations_page.dart';
import 'screens/account/support_ticket_detail_page.dart';
import 'screens/account/support_tickets_page.dart';
import 'screens/account/wallet_page.dart';
import 'screens/account/wishlist_page.dart';
import 'screens/auth/forgot_password_page.dart';
import 'screens/auth/login_page.dart';
import 'screens/auth/register_page.dart';
import 'screens/booking/booking_checkout_page.dart';
import 'screens/booking/booking_detail_page.dart';
import 'screens/booking/hire_driver_page.dart';
import 'screens/booking/my_bookings_page.dart';
import 'screens/home/home_page.dart';
import 'screens/info/about_page.dart';
import 'screens/info/become_partner_page.dart';
import 'screens/info/blog_detail_page.dart';
import 'screens/info/blog_list_page.dart';
import 'screens/info/careers_page.dart';
import 'screens/info/categories_page.dart';
import 'screens/info/cities_page.dart';
import 'screens/info/cms_page.dart';
import 'screens/info/contact_page.dart';
import 'screens/info/faq_page.dart';
import 'screens/info/support_page.dart';
import 'screens/search/search_page.dart';
import 'screens/shell/main_shell.dart';
import 'screens/vehicle/vehicle_detail_page.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.status != next.status) notifyListeners();
    });
  }
}

final customerRouterProvider = Provider<GoRouter>((ref) {
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

      // Everything the public site serves without a session stays browsable
      // signed-out here too, so a shared vehicle or blog link doesn't dead-end
      // at a login wall.
      const publicPaths = {
        "/",
        "/search",
        "/about",
        "/contact",
        "/faq",
        "/support",
        "/blog",
        "/cities",
        "/categories",
        "/become-a-partner",
        "/careers",
        "/privacy-policy",
        "/terms-conditions",
        "/refund-policy",
      };
      final isPublicPath = publicPaths.contains(state.matchedLocation) ||
          state.matchedLocation.startsWith("/vehicle/") ||
          state.matchedLocation.startsWith("/blog/");

      if (!auth.isAuthenticated && !loggingIn && !isPublicPath) {
        return "/login?redirect=${Uri.encodeComponent(state.matchedLocation)}";
      }
      if (auth.isAuthenticated && loggingIn) return "/";
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: "/", builder: (context, state) => const HomePage()),
          GoRoute(path: "/search", builder: (context, state) => const SearchPage()),
          GoRoute(path: "/bookings", builder: (context, state) => const MyBookingsPage()),
          GoRoute(path: "/wishlist", builder: (context, state) => const WishlistPage()),
          GoRoute(path: "/account", builder: (context, state) => const AccountPage()),
        ],
      ),
      GoRoute(
        path: "/login",
        builder: (context, state) => LoginPage(redirectTo: state.uri.queryParameters["redirect"]),
      ),
      GoRoute(path: "/register", builder: (context, state) => const RegisterPage()),
      GoRoute(path: "/forgot-password", builder: (context, state) => const ForgotPasswordPage()),
      GoRoute(
        path: "/vehicle/:id",
        builder: (context, state) => VehicleDetailPage(vehicleId: state.pathParameters["id"]!),
      ),
      GoRoute(
        path: "/checkout/:vehicleId",
        builder: (context, state) => BookingCheckoutPage(vehicleId: state.pathParameters["vehicleId"]!),
      ),
      GoRoute(
        path: "/bookings/:id",
        builder: (context, state) => BookingDetailPage(bookingId: state.pathParameters["id"]!),
      ),
      GoRoute(
        path: "/bookings/:id/hire-driver",
        builder: (context, state) => HireDriverPage(bookingId: state.pathParameters["id"]!),
      ),
      GoRoute(path: "/account/edit", builder: (context, state) => const EditProfilePage()),
      GoRoute(path: "/account/wallet", builder: (context, state) => const WalletPage()),
      GoRoute(path: "/account/payments", builder: (context, state) => const PaymentsPage()),
      GoRoute(path: "/account/licenses", builder: (context, state) => const DrivingLicensesPage()),
      GoRoute(path: "/account/locations", builder: (context, state) => const SavedLocationsPage()),
      GoRoute(path: "/account/notifications", builder: (context, state) => const NotificationsPage()),
      GoRoute(path: "/account/support", builder: (context, state) => const SupportTicketsPage()),
      GoRoute(
        path: "/account/support/:id",
        builder: (context, state) => SupportTicketDetailPage(ticketId: state.pathParameters["id"]!),
      ),

      // Public content pages — same routes as apps/public-site so links shared
      // between web and app resolve to the same screen.
      GoRoute(path: "/about", builder: (context, state) => const AboutPage()),
      GoRoute(path: "/contact", builder: (context, state) => const ContactPage()),
      GoRoute(path: "/faq", builder: (context, state) => const FaqPage()),
      GoRoute(path: "/support", builder: (context, state) => const SupportPage()),
      GoRoute(path: "/cities", builder: (context, state) => const CitiesPage()),
      GoRoute(path: "/categories", builder: (context, state) => const CategoriesPage()),
      GoRoute(path: "/careers", builder: (context, state) => const CareersPage()),
      GoRoute(path: "/become-a-partner", builder: (context, state) => const BecomePartnerPage()),
      GoRoute(path: "/blog", builder: (context, state) => const BlogListPage()),
      GoRoute(
        path: "/blog/:slug",
        builder: (context, state) => BlogDetailPage(slug: state.pathParameters["slug"]!),
      ),
      GoRoute(
        path: "/privacy-policy",
        builder: (context, state) => const CmsContentPage(slug: "privacy-policy", title: "Privacy Policy"),
      ),
      GoRoute(
        path: "/terms-conditions",
        builder: (context, state) => const CmsContentPage(slug: "terms-conditions", title: "Terms & Conditions"),
      ),
      GoRoute(
        path: "/refund-policy",
        builder: (context, state) => const CmsContentPage(slug: "refund-policy", title: "Refund Policy"),
      ),
    ],
  );
});
