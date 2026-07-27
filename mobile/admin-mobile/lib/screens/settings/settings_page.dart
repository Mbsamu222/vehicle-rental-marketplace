import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/settings/SettingsPage.tsx — the key/value
/// platform settings editor and the change-password form.
const _defaultKey = "platform.commission_default";

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  final _key = TextEditingController(text: _defaultKey);
  final _value = TextEditingController();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();

  bool _loadingSetting = false;
  String? _settingNote;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadSetting());
  }

  @override
  void dispose() {
    _key.dispose();
    _value.dispose();
    _currentPassword.dispose();
    _newPassword.dispose();
    super.dispose();
  }

  /// A missing key 404s rather than returning null, so "not found" is reported
  /// as "no value yet" instead of as an error — same as the web page.
  Future<void> _loadSetting() async {
    final key = _key.text.trim();
    if (key.isEmpty) return;
    setState(() {
      _loadingSetting = true;
      _settingNote = null;
    });
    try {
      final setting = await ref.read(marketplaceApiProvider).admin.getSetting(key);
      final value = setting["value"];
      _value.text = value is String ? value : const JsonEncoder.withIndent("  ").convert(value);
    } on ApiException {
      _value.text = "";
      _settingNote = "This key has no value yet — enter one below to create it.";
    } finally {
      if (mounted) setState(() => _loadingSetting = false);
    }
  }

  Future<void> _saveSetting() async {
    final key = _key.text.trim();
    if (key.isEmpty) return;

    // Store structured values as JSON where the text parses, plain text
    // otherwise — matching the web editor's behaviour exactly.
    Object? parsed;
    try {
      parsed = jsonDecode(_value.text);
    } on FormatException {
      parsed = _value.text;
    }

    try {
      await ref.read(marketplaceApiProvider).admin.upsertSetting(key, parsed);
      if (!mounted) return;
      setState(() => _settingNote = null);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Setting saved")));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Could not save setting: ${e.message}")));
    }
  }

  Future<void> _changePassword() async {
    try {
      await ref.read(authControllerProvider.notifier).changePassword(
            currentPassword: _currentPassword.text,
            newPassword: _newPassword.text,
          );
      if (!mounted) return;
      _currentPassword.clear();
      _newPassword.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Password changed")));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Could not change password: $e")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Settings")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const PageHeader(title: "Settings"),
          const SizedBox(height: 18),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.settings_outlined, size: 17, color: AppColors.secondary),
                    const SizedBox(width: 8),
                    Text(
                      "Platform settings",
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "Simple key/value settings storage. View or edit a single key at a time; values are stored as JSON when possible, otherwise as plain text.",
                  style: TextStyle(fontSize: 12, height: 1.5, color: AppColors.mutedTextOf(context)),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _key,
                  decoration: InputDecoration(
                    labelText: "Setting key",
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.refresh),
                      tooltip: "Load this key",
                      onPressed: _loadSetting,
                    ),
                  ),
                  onSubmitted: (_) => _loadSetting(),
                ),
                if (_loadingSetting) ...[
                  const SizedBox(height: 10),
                  Text("Loading…", style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context))),
                ] else if (_settingNote != null) ...[
                  const SizedBox(height: 10),
                  Text(_settingNote!, style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context))),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: _value,
                  maxLines: 6,
                  decoration: const InputDecoration(labelText: "Value", alignLabelWithHint: true),
                ),
                const SizedBox(height: 16),
                LoadingButton(label: "Save setting", onPressed: _saveSetting),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Change password",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _currentPassword,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: "Current password"),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _newPassword,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: "New password"),
                ),
                const SizedBox(height: 16),
                LoadingButton(label: "Update password", onPressed: _changePassword),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
