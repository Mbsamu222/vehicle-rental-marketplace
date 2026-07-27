import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Admin notifications, sharing mobile_core's [NotificationsView] with the
/// customer and partner apps. Admin alerts are mostly moderation queues, so a
/// notification carrying a partner or ticket id deep-links to that review
/// screen rather than to a booking.
class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text("Notifications")),
      body: NotificationsView(
        subtitle: "Approval queues, escalations, and platform alerts.",
        onOpen: (notification) {
          final data = notification.data;
          final ticketId = data?["ticketId"];
          if (ticketId is String && ticketId.isNotEmpty) {
            context.push("/support/$ticketId");
            return;
          }
          final partnerId = data?["rentalPartnerId"];
          if (partnerId is String && partnerId.isNotEmpty) {
            context.push("/approvals/partners/$partnerId");
            return;
          }
          final userId = data?["userId"];
          if (userId is String && userId.isNotEmpty) context.push("/users/$userId");
        },
      ),
    );
  }
}
