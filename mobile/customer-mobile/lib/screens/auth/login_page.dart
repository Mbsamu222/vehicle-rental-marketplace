import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

class LoginPage extends ConsumerStatefulWidget {
  final String? redirectTo;
  const LoginPage({super.key, this.redirectTo});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = null);
    try {
      await ref.read(authControllerProvider.notifier).loginWithEmail(_email.text.trim(), _password.text);
      if (!mounted) return;
      context.go(widget.redirectTo ?? "/");
    } on FirebaseAuthException catch (e) {
      setState(() => _error = firebaseAuthErrorMessage(e));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = "Couldn't sign in. Check your email and password.");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                const AuthBrandHeader(tagline: "Discover and book vehicles from trusted local partners."),
                const SizedBox(height: 28),
                Text("Welcome back", style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text("Sign in to continue booking.", style: TextStyle(color: AppColors.mutedTextOf(context))),
                const SizedBox(height: 32),
                if (_error != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_error!, style: const TextStyle(color: AppColors.danger)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: "Email"),
                  validator: (v) => (v == null || !v.contains("@")) ? "Enter a valid email" : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: "Password",
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) => (v == null || v.isEmpty) ? "Enter your password" : null,
                  onFieldSubmitted: (_) => _submit(),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push("/forgot-password"),
                    child: const Text("Forgot password?"),
                  ),
                ),
                const SizedBox(height: 8),
                LoadingButton(label: "Sign in", onPressed: _submit),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("New here?", style: TextStyle(color: AppColors.mutedTextOf(context))),
                    TextButton(onPressed: () => context.push("/register"), child: const Text("Create an account")),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
