import 'api_client.dart';
import 'endpoints/admin_api.dart';
import 'endpoints/auth_api.dart';
import 'endpoints/bookings_api.dart';
import 'endpoints/catalog_api.dart';
import 'endpoints/coupons_api.dart';
import 'endpoints/notifications_api.dart';
import 'endpoints/payments_api.dart';
import 'endpoints/rental_partners_api.dart';
import 'endpoints/reviews_api.dart';
import 'endpoints/support_api.dart';
import 'endpoints/users_api.dart';
import 'endpoints/vehicles_api.dart';

/// Single entry point bundling every endpoint module against one [ApiClient]
/// — apps depend on this instead of wiring up each `*Api` class individually.
class MarketplaceApi {
  final ApiClient client;
  late final AuthApi auth = AuthApi(client);
  late final CatalogApi catalog = CatalogApi(client);
  late final VehiclesApi vehicles = VehiclesApi(client);
  late final BookingsApi bookings = BookingsApi(client);
  late final PaymentsApi payments = PaymentsApi(client);
  late final UsersApi users = UsersApi(client);
  late final RentalPartnersApi rentalPartners = RentalPartnersApi(client);
  late final ReviewsApi reviews = ReviewsApi(client);
  late final NotificationsApi notifications = NotificationsApi(client);
  late final CouponsApi coupons = CouponsApi(client);
  late final SupportApi support = SupportApi(client);
  late final AdminApi admin = AdminApi(client);

  MarketplaceApi({required String baseUrl}) : client = ApiClient(baseUrl: baseUrl);
}
