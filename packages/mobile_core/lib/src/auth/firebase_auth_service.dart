import 'package:firebase_auth/firebase_auth.dart';

/// Wraps the Firebase Auth SDK for mobile — the counterpart of
/// packages/api-client/src/firebase.ts on web. The backend never issues its
/// own tokens; it only verifies the Firebase ID token this session produces
/// (see backend/app/core/firebase.py), so every screen authenticates through
/// this service and then calls MarketplaceApi.auth.sync()/me().
///
/// Phone sign-in uses `verifyPhoneNumber` (native SMS auto-retrieval / Play
/// Integrity or APNs silent push) rather than web's `RecaptchaVerifier` —
/// there is no visible reCAPTCHA step on mobile, but Android needs the app's
/// SHA-1/SHA-256 fingerprints registered in the Firebase console and iOS
/// needs APNs configured, or `verifyPhoneNumber` will fail app verification.
class FirebaseAuthService {
  final FirebaseAuth _auth;
  FirebaseAuthService([FirebaseAuth? auth]) : _auth = auth ?? FirebaseAuth.instance;

  Stream<User?> authStateChanges() => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<String?> getIdToken({bool forceRefresh = false}) => _auth.currentUser?.getIdToken(forceRefresh) ?? Future.value(null);

  Future<UserCredential> signUpWithEmail(String email, String password) =>
      _auth.createUserWithEmailAndPassword(email: email, password: password);

  Future<UserCredential> signInWithEmail(String email, String password) =>
      _auth.signInWithEmailAndPassword(email: email, password: password);

  Future<void> signOut() => _auth.signOut();

  Future<void> sendPasswordResetEmail(String email) => _auth.sendPasswordResetEmail(email: email);

  /// Starts phone verification. Exactly one of [onAutoVerified] or
  /// [onCodeSent] fires for a given attempt; call [confirmCode] with the
  /// user-entered SMS code once [onCodeSent] has fired.
  Future<void> startPhoneVerification({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(FirebaseAuthException error) onError,
    void Function(UserCredential credential)? onAutoVerified,
    Duration timeout = const Duration(seconds: 60),
  }) {
    return _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      timeout: timeout,
      verificationCompleted: (PhoneAuthCredential credential) async {
        try {
          final result = await _auth.signInWithCredential(credential);
          onAutoVerified?.call(result);
        } on FirebaseAuthException catch (e) {
          onError(e);
        }
      },
      verificationFailed: onError,
      codeSent: (String verificationId, int? resendToken) => onCodeSent(verificationId),
      codeAutoRetrievalTimeout: (String verificationId) {},
    );
  }

  Future<UserCredential> confirmPhoneSignIn({required String verificationId, required String smsCode}) {
    final credential = PhoneAuthProvider.credential(verificationId: verificationId, smsCode: smsCode);
    return _auth.signInWithCredential(credential);
  }

  /// Attaches a phone number to the already-signed-in (email/password) user —
  /// used on the register screen, mirroring `linkPhoneToCurrentUser` on web.
  Future<UserCredential> linkPhoneToCurrentUser({required String verificationId, required String smsCode}) {
    final user = _auth.currentUser;
    if (user == null) throw StateError("No signed-in user to link a phone number to");
    final credential = PhoneAuthProvider.credential(verificationId: verificationId, smsCode: smsCode);
    return user.linkWithCredential(credential);
  }

  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    final user = _auth.currentUser;
    final email = user?.email;
    if (user == null || email == null) throw StateError("No signed-in user");
    final credential = EmailAuthProvider.credential(email: email, password: currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
  }
}
