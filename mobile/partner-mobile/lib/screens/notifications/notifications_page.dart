import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/partner-web/src/screens/notifications/NotificationsPage.tsx.
/// The list itself is shared (mobile_core's [NotificationsView]); this screen
/// supplies the partner-specific deep link — a booking notification opens the
/// partner booking detail, not the customer one.
class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text("Notifications")),
      body: NotificationsView(
        onOpen: (notification) {
          final bookingId = notification.data?["bookingId"];
          if (bookingId is String && bookingId.isNotEmpty) context.push("/bookings/$bookingId");
        },
      ),
    );
  }
}
