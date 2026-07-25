import 'package:dio/dio.dart';

import '../models/pagination.dart';
import 'api_exception.dart';

/// Thin wrapper around the API's `{success, data, meta}` / `{success:false,
/// message, details}` envelope (backend/app/core/responses.py,
/// exception_handlers.py) — every endpoint module builds on top of this
/// instead of touching Dio directly.
class ApiClient {
  final Dio _dio;
  Future<String?> Function()? idTokenProvider;
  void Function()? onUnauthorized;

  ApiClient({required String baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
          headers: {"Content-Type": "application/json"},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final provider = idTokenProvider;
        if (provider != null) {
          final token = await provider();
          if (token != null) options.headers["Authorization"] = "Bearer $token";
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) onUnauthorized?.call();
        handler.next(error);
      },
    ));
  }

  Future<Object?> _unwrap(Future<Response<dynamic>> Function() request) async {
    try {
      final response = await request();
      final body = response.data;
      if (body is Map && body["success"] == false) {
        throw ApiException(
          (body["message"] as String?) ?? "Request failed",
          statusCode: response.statusCode,
          details: body["details"],
        );
      }
      return body is Map ? body["data"] : body;
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is Map) {
        throw ApiException(
          (body["message"] as String?) ?? "Request failed",
          statusCode: e.response?.statusCode,
          details: body["details"],
        );
      }
      throw ApiException(_dioErrorMessage(e), statusCode: e.response?.statusCode);
    }
  }

  String _dioErrorMessage(DioException e) => switch (e.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.sendTimeout ||
        DioExceptionType.receiveTimeout =>
          "The request timed out. Check your connection and try again.",
        DioExceptionType.connectionError => "Couldn't reach the server. Check your connection.",
        _ => e.message ?? "Something went wrong",
      };

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    required T Function(Object? data) parse,
  }) async {
    final data = await _unwrap(() => _dio.get(path, queryParameters: _cleanQuery(query)));
    return parse(data);
  }

  Future<Paginated<T>> getPaginated<T>(
    String path, {
    Map<String, dynamic>? query,
    required T Function(Map<String, dynamic> json) parseItem,
  }) async {
    Response<dynamic>? rawResponse;
    final data = await _unwrap(() async {
      final res = await _dio.get(path, queryParameters: _cleanQuery(query));
      rawResponse = res;
      return res;
    });
    final body = rawResponse!.data as Map;
    final items = (data as List? ?? const []).whereType<Map>().map((e) => parseItem(Map<String, dynamic>.from(e))).toList();
    return Paginated<T>(items: items, meta: PageMeta.fromJson(body["meta"] as Map<String, dynamic>?));
  }

  Future<T> post<T>(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    required T Function(Object? data) parse,
  }) async {
    final data = await _unwrap(() => _dio.post(path, data: body, queryParameters: _cleanQuery(query)));
    return parse(data);
  }

  Future<T> patch<T>(
    String path, {
    Object? body,
    required T Function(Object? data) parse,
  }) async {
    final data = await _unwrap(() => _dio.patch(path, data: body));
    return parse(data);
  }

  Future<T> put<T>(
    String path, {
    Object? body,
    required T Function(Object? data) parse,
  }) async {
    final data = await _unwrap(() => _dio.put(path, data: body));
    return parse(data);
  }

  Future<T> delete<T>(
    String path, {
    required T Function(Object? data) parse,
  }) async {
    final data = await _unwrap(() => _dio.delete(path));
    return parse(data);
  }

  Map<String, dynamic>? _cleanQuery(Map<String, dynamic>? query) {
    if (query == null) return null;
    final cleaned = <String, dynamic>{};
    for (final entry in query.entries) {
      if (entry.value == null) continue;
      cleaned[entry.key] = entry.value;
    }
    return cleaned;
  }
}

/// Parsers shared by every endpoint module.
Object? asIs(Object? data) => data;
Map<String, dynamic> asJsonMap(Object? data) => Map<String, dynamic>.from(data as Map? ?? const {});
void asVoid(Object? data) {}
