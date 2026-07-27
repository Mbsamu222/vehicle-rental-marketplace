import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/account/notifications/NotificationsPage.tsx.
/// The list is shared with the partner and admin apps (mobile_core's
/// [NotificationsView]); this screen only supplies the customer-side deep link.
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
