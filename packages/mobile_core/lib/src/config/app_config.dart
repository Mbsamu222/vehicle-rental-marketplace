import 'package:flutter/foundation.dart';

/// Reads the API base URL from a compile-time define so the same build can
/// point at a local backend during development and a deployed one in
/// release, without checking a secret into source — mirrors each web app's
/// `NEXT_PUBLIC_API_URL`. Pass with:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
class AppConfig {
  AppConfig._();

  static const String _envApiBaseUrl = String.fromEnvironment("API_BASE_URL");

  /// 10.0.2.2 is the Android emulator's alias for the host machine's
  /// localhost — it is NOT reachable from a browser tab or a desktop/iOS
  /// simulator process, both of which must use `localhost` directly. Only
  /// Android needs the special-cased address; every other target defaults
  /// to `localhost` unless `--dart-define=API_BASE_URL=...` overrides it.
  static String get defaultApiBaseUrl {
    if (_envApiBaseUrl.isNotEmpty) return _envApiBaseUrl;
    final isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
    return "http://${isAndroid ? '10.0.2.2' : 'localhost'}:4000/api/v1";
  }
}
