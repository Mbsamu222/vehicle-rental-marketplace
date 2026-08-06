/// The API encodes Decimal fields as strings (see backend `_CUSTOM_ENCODERS`)
/// and numbers only for plain ints — these helpers accept either shape so
/// model parsing never breaks on a representation change.
double asDouble(Object? value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

double? asDoubleOrNull(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int asInt(Object? value, [int fallback = 0]) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

int? asIntOrNull(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

String asString(Object? value, [String fallback = ""]) => value == null ? fallback : value.toString();

String? asStringOrNull(Object? value) => value?.toString();

bool asBool(Object? value, [bool fallback = false]) => value is bool ? value : fallback;

DateTime? asDateOrNull(Object? value) {
  if (value == null) return null;
  if (value is String) return DateTime.tryParse(value);
  return null;
}

DateTime asDate(Object? value) => asDateOrNull(value) ?? DateTime.fromMillisecondsSinceEpoch(0);

Map<String, dynamic>? asMapOrNull(Object? value) => value is Map ? Map<String, dynamic>.from(value) : null;

List<Map<String, dynamic>> asMapList(Object? value) {
  if (value is! List) return const [];
  return value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
}
