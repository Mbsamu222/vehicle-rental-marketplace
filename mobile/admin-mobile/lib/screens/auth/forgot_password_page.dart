import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/auth/ForgotPasswordPage.tsx. Same flow as
/// the customer and partner apps: Firebase sends the reset link, and the link
/// itself is completed on the web (there is no ActionCodeSettings deep link
/// configured, so no in-app reset screen).
class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  String? _error;
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = null);
    try {
      await ref.read(authControllerProvider.notifier).sendPasswordResetEmail(_email.text.trim());
      setState(() => _sent = true);
    } on FirebaseAuthException catch (e) {
      setState(() => _error = firebaseAuthErrorMessage(e));
    } catch (_) {
      setState(() => _error = "Couldn't send the reset email. Check the address and try again.");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Reset password")),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _sent
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.mark_email_read_outlined, size: 48, color: AppColors.success),
                    const SizedBox(height: 16),
                    Text("Check your email", style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text(
                      "We've sent a password reset link to ${_email.text.trim()}.",
                      style: TextStyle(color: AppColors.mutedTextOf(context)),
                    ),
                  ],
                )
              : Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const AuthBrandHeader(
                        icon: Icons.admin_panel_settings_rounded,
                        tagline: "Reset your admin account password.",
                      ),
                      const SizedBox(height: 28),
                      Text(
                        "Enter your account email and we'll send a reset link.",
                        style: TextStyle(color: AppColors.mutedTextOf(context)),
                      ),
                      const SizedBox(height: 20),
                      if (_error != null) ...[
                        Text(_error!, style: const TextStyle(color: AppColors.danger)),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: "Email"),
                        validator: (v) => (v == null || !v.contains("@")) ? "Enter a valid email" : null,
                      ),
                      const SizedBox(height: 24),
                      LoadingButton(label: "Send reset link", onPressed: _submit),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
