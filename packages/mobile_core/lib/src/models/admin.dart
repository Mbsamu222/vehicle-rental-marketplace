import '../utils/json_helpers.dart';

class Permission {
  final String id;
  final String key;
  final String module;
  final String? description;

  Permission({required this.id, required this.key, required this.module, this.description});

  factory Permission.fromJson(Map<String, dynamic> json) => Permission(
        id: asString(json["id"]),
        key: asString(json["key"]),
        module: asString(json["module"]),
        description: asStringOrNull(json["description"]),
      );
}

class Role {
  final String id;
  final String name;
  final String? description;
  final bool isSystem;
  final List<Permission> permissions;

  Role({required this.id, required this.name, this.description, required this.isSystem, this.permissions = const []});

  factory Role.fromJson(Map<String, dynamic> json) => Role(
        id: asString(json["id"]),
        name: asString(json["name"]),
        description: asStringOrNull(json["description"]),
        isSystem: asBool(json["isSystem"]),
        permissions: asMapList(json["permissions"]).map(Permission.fromJson).toList(),
      );
}

class AuditLog {
  final String id;
  final String? userId;
  final String action;
  final String entityType;
  final String? entityId;
  final Map<String, dynamic>? before;
  final Map<String, dynamic>? after;
  final String? ipAddress;
  final DateTime createdAt;

  AuditLog({
    required this.id,
    this.userId,
    required this.action,
    required this.entityType,
    this.entityId,
    this.before,
    this.after,
    this.ipAddress,
    required this.createdAt,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) => AuditLog(
        id: asString(json["id"]),
        userId: asStringOrNull(json["userId"]),
        action: asString(json["action"]),
        entityType: asString(json["entityType"]),
        entityId: asStringOrNull(json["entityId"]),
        before: asMapOrNull(json["before"]),
        after: asMapOrNull(json["after"]),
        ipAddress: asStringOrNull(json["ipAddress"]),
        createdAt: asDate(json["createdAt"]),
      );
}

class AdminDashboardStats {
  final int totalCustomers;
  final int totalPartners;
  final int verifiedPartners;
  final int totalVehicles;
  final int pendingVehicleApprovals;
  final int totalBookings;
  final int activeBookings;
  final double totalRevenue;
  final int pendingSupportTickets;

  AdminDashboardStats({
    required this.totalCustomers,
    required this.totalPartners,
    required this.verifiedPartners,
    required this.totalVehicles,
    required this.pendingVehicleApprovals,
    required this.totalBookings,
    required this.activeBookings,
    required this.totalRevenue,
    required this.pendingSupportTickets,
  });

  factory AdminDashboardStats.fromJson(Map<String, dynamic> json) => AdminDashboardStats(
        totalCustomers: asInt(json["totalCustomers"]),
        totalPartners: asInt(json["totalPartners"]),
        verifiedPartners: asInt(json["verifiedPartners"]),
        totalVehicles: asInt(json["totalVehicles"]),
        pendingVehicleApprovals: asInt(json["pendingVehicleApprovals"]),
        totalBookings: asInt(json["totalBookings"]),
        activeBookings: asInt(json["activeBookings"]),
        totalRevenue: asDouble(json["totalRevenue"]),
        pendingSupportTickets: asInt(json["pendingSupportTickets"]),
      );
}

class CustomerDashboardStats {
  final int activeBookings;
  final int completedBookings;
  final int wishlistCount;
  final double walletBalance;

  CustomerDashboardStats({
    required this.activeBookings,
    required this.completedBookings,
    required this.wishlistCount,
    required this.walletBalance,
  });

  factory CustomerDashboardStats.fromJson(Map<String, dynamic> json) => CustomerDashboardStats(
        activeBookings: asInt(json["activeBookings"]),
        completedBookings: asInt(json["completedBookings"]),
        wishlistCount: asInt(json["wishlistCount"]),
        walletBalance: asDouble(json["walletBalance"]),
      );
}
