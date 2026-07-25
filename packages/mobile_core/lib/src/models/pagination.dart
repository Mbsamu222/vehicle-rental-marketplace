import '../utils/json_helpers.dart';

class PageMeta {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final int? unreadCount;

  PageMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    this.unreadCount,
  });

  bool get hasMore => page < totalPages;

  factory PageMeta.fromJson(Map<String, dynamic>? json) {
    if (json == null) return PageMeta(page: 1, limit: 20, total: 0, totalPages: 1);
    return PageMeta(
      page: asInt(json["page"], 1),
      limit: asInt(json["limit"], 20),
      total: asInt(json["total"]),
      totalPages: asInt(json["totalPages"], 1),
      unreadCount: asIntOrNull(json["unreadCount"]),
    );
  }
}

class Paginated<T> {
  final List<T> items;
  final PageMeta meta;

  Paginated({required this.items, required this.meta});
}
