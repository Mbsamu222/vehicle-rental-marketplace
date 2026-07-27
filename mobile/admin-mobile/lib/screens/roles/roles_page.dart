import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/roles/RolesPage.tsx — roles with their
/// permission sets, grouped by module. System roles are read-only on the
/// backend, so their edit affordances are hidden rather than shown-and-failing.
final _rolesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.roles());
final _permissionsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.permissions());

class RolesPage extends ConsumerWidget {
  const RolesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roles = ref.watch(_rolesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Roles & permissions")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openRoleSheet(context, ref, null),
        icon: const Icon(Icons.add),
        label: const Text("New role"),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_rolesProvider),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
          children: [
            const PageHeader(
              title: "Roles & permissions",
              subtitle: "Control what each admin team member can access.",
            ),
            const SizedBox(height: 16),
            roles.when(
              data: (list) => list.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.only(top: 32),
                      child: EmptyState(icon: Icons.shield_outlined, title: "No roles defined"),
                    )
                  : Column(
                      children: [
                        for (final role in list) ...[
                          _RoleCard(
                            role: role,
                            onEdit: role.isSystem ? null : () => _openRoleSheet(context, ref, role),
                            onDelete: role.isSystem ? null : () => _confirmDelete(context, ref, role),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ],
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_rolesProvider)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, Role role) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Delete ${role.name}?"),
        content: const Text("Team members assigned this role will lose its permissions. This can't be undone."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text("Delete"),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(marketplaceApiProvider).admin.deleteRole(role.id);
      ref.invalidate(_rolesProvider);
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  void _openRoleSheet(BuildContext context, WidgetRef ref, Role? role) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _RoleForm(role: role, onSaved: () => ref.invalidate(_rolesProvider)),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final Role role;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  const _RoleCard({required this.role, this.onEdit, this.onDelete});

  @override
  Widget build(BuildContext context) {
    // Permissions come back flat; grouping by module matches how the web page
    // presents them and keeps long lists scannable.
    final byModule = <String, List<Permission>>{};
    for (final permission in role.permissions) {
      byModule.putIfAbsent(permission.module, () => []).add(permission);
    }

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            role.name,
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                          ),
                        ),
                        if (role.isSystem) ...[
                          const SizedBox(width: 8),
                          const StatusBadge(label: "System", tone: BadgeTone.neutral),
                        ],
                      ],
                    ),
                    if (role.description != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        role.description!,
                        style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                      ),
                    ],
                  ],
                ),
              ),
              if (onEdit != null)
                IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: onEdit),
              if (onDelete != null)
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.danger),
                  onPressed: onDelete,
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (role.permissions.isEmpty)
            Text("No permissions assigned", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)))
          else
            for (final entry in byModule.entries)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.key.toUpperCase(),
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.7,
                        color: AppColors.mutedTextOf(context),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final permission in entry.value)
                          StatusBadge(label: permission.key, tone: BadgeTone.info),
                      ],
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

class _RoleForm extends ConsumerStatefulWidget {
  final Role? role;
  final VoidCallback onSaved;
  const _RoleForm({required this.role, required this.onSaved});

  @override
  ConsumerState<_RoleForm> createState() => _RoleFormState();
}

class _RoleFormState extends ConsumerState<_RoleForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.role?.name ?? "");
  late final TextEditingController _description = TextEditingController(text: widget.role?.description ?? "");
  late final Set<String> _selected = {...?widget.role?.permissions.map((p) => p.id)};

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final api = ref.read(marketplaceApiProvider).admin;

    try {
      if (widget.role == null) {
        await api.createRole(
          name: _name.text.trim(),
          description: _description.text.trim().isEmpty ? null : _description.text.trim(),
          permissionIds: _selected.toList(),
        );
      } else {
        await api.updateRole(widget.role!.id, {
          "name": _name.text.trim(),
          "description": _description.text.trim().isEmpty ? null : _description.text.trim(),
          "permissionIds": _selected.toList(),
        });
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(_permissionsProvider);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              widget.role == null ? "New role" : "Edit ${widget.role!.name}",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: "Role name"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Name is required" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _description,
              decoration: const InputDecoration(labelText: "Description (optional)"),
            ),
            const SizedBox(height: 18),
            Text(
              "Permissions",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 8),
            permissions.when(
              data: (list) {
                final byModule = <String, List<Permission>>{};
                for (final permission in list) {
                  byModule.putIfAbsent(permission.module, () => []).add(permission);
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final entry in byModule.entries) ...[
                      Padding(
                        padding: const EdgeInsets.only(top: 10, bottom: 4),
                        child: Text(
                          entry.key.toUpperCase(),
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.7,
                            color: AppColors.mutedTextOf(context),
                          ),
                        ),
                      ),
                      for (final permission in entry.value)
                        CheckboxListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          controlAffinity: ListTileControlAffinity.leading,
                          value: _selected.contains(permission.id),
                          title: Text(permission.key, style: const TextStyle(fontSize: 13)),
                          subtitle: permission.description == null
                              ? null
                              : Text(permission.description!, style: const TextStyle(fontSize: 11)),
                          onChanged: (checked) => setState(() {
                            if (checked == true) {
                              _selected.add(permission.id);
                            } else {
                              _selected.remove(permission.id);
                            }
                          }),
                        ),
                    ],
                  ],
                );
              },
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_permissionsProvider)),
            ),
            const SizedBox(height: 20),
            LoadingButton(label: widget.role == null ? "Create role" : "Save changes", onPressed: _save),
          ],
        ),
      ),
    );
  }
}
