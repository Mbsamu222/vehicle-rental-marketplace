/// Raised for both transport failures and `{success: false}` API responses —
/// callers only ever need to catch this one type.
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final Object? details;

  ApiException(this.message, {this.statusCode, this.details});

  bool get isUnauthorized => statusCode == 401;
  bool get isNotFound => statusCode == 404;

  @override
  String toString() => message;
}
