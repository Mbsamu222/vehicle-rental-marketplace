import '../../models/notification.dart';
import '../../models/pagination.dart';
import '../api_client.dart';

class NotificationsApi {
  final ApiClient _client;
  NotificationsApi(this._client);

  Future<Paginated<AppNotification>> list({bool? unreadOnly, int page = 1, int limit = 20}) => _client.getPaginated(
        "/notifications",
        query: {"unreadOnly": unreadOnly, "page": page, "limit": limit},
        parseItem: AppNotification.fromJson,
      );

  Future<void> markRead(String id) => _client.patch("/notifications/$id/read", parse: asVoid);

  Future<void> markAllRead() => _client.patch("/notifications/read-all", parse: asVoid);
}
