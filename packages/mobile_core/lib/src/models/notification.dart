import 'enums.dart';
import '../utils/json_helpers.dart';

class AppNotification {
  final String id;
  final String userId;
  final NotificationChannel channel;
  final String title;
  final String message;
  final Map<String, dynamic>? data;
  final DateTime? readAt;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    required this.channel,
    required this.title,
    required this.message,
    this.data,
    this.readAt,
    required this.createdAt,
  });

  bool get isUnread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        channel: NotificationChannel.fromJson(asStringOrNull(json["channel"])),
        title: asString(json["title"]),
        message: asString(json["message"]),
        data: asMapOrNull(json["data"]),
        readAt: asDateOrNull(json["readAt"]),
        createdAt: asDate(json["createdAt"]),
      );
}
