// Hand-written in place of `flutterfire configure`'s generated file, using
// the same Firebase project ("vehicle-rent-001") the three web apps already
// use (see apps/public-site/.env). Values are the project's public web-app
// config — safe to embed client-side, not the service-account secret.
//
// This is enough for Firebase Auth (email/password, and phone once the
// project has SMS enabled) to work against every platform, because Auth's
// REST calls only need `apiKey` + `projectId`. It is NOT a substitute for
// registering a real Android/iOS app in the Firebase console:
//   - Phone auth app-verification on Android needs the app's SHA-1/SHA-256
//     fingerprints registered against an Android app entry.
//   - Phone auth silent push on iOS needs an APNs key/certificate registered
//     against an iOS app entry.
//   - Push notifications (FCM) need `google-services.json` /
//     `GoogleService-Info.plist` from a real per-platform app registration.
// Run `flutterfire configure --project=vehicle-rent-001` once you have
// Firebase CLI access to replace this file with fully platform-specific config.
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        return web;
    }
  }

  static const web = FirebaseOptions(
    apiKey: "AIzaSyBZxyRkmKxgkmW_kgPQEJTT-iIisNwQnqI",
    authDomain: "vehicle-rent-001.firebaseapp.com",
    projectId: "vehicle-rent-001",
    storageBucket: "vehicle-rent-001.firebasestorage.app",
    messagingSenderId: "621116476363",
    appId: "1:621116476363:web:c2c9375d23ff30858fc44e",
  );

  static const android = FirebaseOptions(
    apiKey: "AIzaSyBZxyRkmKxgkmW_kgPQEJTT-iIisNwQnqI",
    projectId: "vehicle-rent-001",
    storageBucket: "vehicle-rent-001.firebasestorage.app",
    messagingSenderId: "621116476363",
    appId: "1:621116476363:web:c2c9375d23ff30858fc44e",
  );

  static const ios = FirebaseOptions(
    apiKey: "AIzaSyBZxyRkmKxgkmW_kgPQEJTT-iIisNwQnqI",
    projectId: "vehicle-rent-001",
    storageBucket: "vehicle-rent-001.firebasestorage.app",
    messagingSenderId: "621116476363",
    appId: "1:621116476363:web:c2c9375d23ff30858fc44e",
    iosBundleId: "com.rentalmarketplace.adminMobile",
  );

  static const macos = ios;
}
