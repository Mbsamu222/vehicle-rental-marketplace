import 'package:firebase_auth/firebase_auth.dart';

/// Maps a [FirebaseAuthException.code] to a short, user-facing message.
/// [FirebaseAuthService]'s sign-in/sign-up calls throw this type directly
/// (it isn't wrapped into [ApiException] like backend calls are), so every
/// auth screen must catch it explicitly — otherwise it falls into a generic
/// `catch (_)` and the real reason (wrong password vs. email-in-use vs. no
/// network) is lost behind one unhelpful string.
String firebaseAuthErrorMessage(FirebaseAuthException e) {
  switch (e.code) {
    case "email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "invalid-email":
      return "Enter a valid email address.";
    case "weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "user-not-found":
    case "wrong-password":
    case "invalid-credential":
      return "Incorrect email or password.";
    case "user-disabled":
      return "This account has been disabled. Contact support.";
    case "too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "network-request-failed":
      return "No internet connection. Check your network and try again.";
    case "operation-not-allowed":
      return "Email/password sign-in isn't enabled for this app yet.";
    default:
      return e.message ?? "Something went wrong. Please try again.";
  }
}
