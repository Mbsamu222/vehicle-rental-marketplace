import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/audit/AuditLogsPage.tsx. The web table
/// shows before/after JSON inline; on a phone each entry expands to reveal it.
///
/// The entity filter is free text, matching the web input, because nothing
/// enumerates the values: `audit_logs` is read by
/// `GET /admin/audit-logs` but no backend path writes to it yet, so a fixed
/// chip list would be a guess at a vocabulary that doesn't exist. The empty
/// state says as much rather than implying the trail is simply quiet.
final _entityFilterProvider = StateProvider.autoDispose<String?>((ref) => null);

final _auditLogsProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(marketplaceApiProvider).admin.auditLogs(
        entityType: ref.watch(_entityFilterProvider),
        limit: 50,
      ),
);

class AuditLogsPage extends ConsumerStatefulWidget {
  const AuditLogsPage({super.key});

  @override
  ConsumerState<AuditLogsPage> createState() => _AuditLogsPageState();
}

class _AuditLogsPageState extends ConsumerState<AuditLogsPage> {
  final _filter = TextEditingController();

  @override
  void dispose() {
    _filter.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logs = ref.watch(_auditLogsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Audit logs")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_auditLogsProvider),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const PageHeader(
              title: "Audit logs",
              subtitle: "Read-only trail of administrative and system actions.",
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _filter,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: "Filter by entity type (e.g. Vehicle)",
                prefixIcon: const Icon(Icons.filter_alt_outlined),
                suffixIcon: _filter.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _filter.clear();
                          ref.read(_entityFilterProvider.notifier).state = null;
                        },
                      ),
              ),
              onChanged: (_) => setState(() {}),
              onSubmitted: (value) {
                final trimmed = value.trim();
                ref.read(_entityFilterProvider.notifier).state = trimmed.isEmpty ? null : trimmed;
              },
            ),
            const SizedBox(height: 16),
            logs.when(
              data: (page) => page.items.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.only(top: 32),
                      child: EmptyState(
                        icon: Icons.history,
                        title: "No audit log entries",
                        message:
                            "Nothing has been recorded yet. The backend exposes this trail but no module writes to it, so it stays empty until audit writes are added.",
                      ),
                    )
                  : Column(
                      children: [
                        for (final log in page.items) ...[
                          _AuditRow(log: log),
                          const SizedBox(height: 10),
                        ],
                      ],
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_auditLogsProvider)),
            ),
          ],
        ),
      ),
    );
  }
}

class _AuditRow extends StatefulWidget {
  final AuditLog log;
  const _AuditRow({required this.log});

  @override
  State<_AuditRow> createState() => _AuditRowState();
}

class _AuditRowState extends State<_AuditRow> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final log = widget.log;
    final hasDiff = log.before != null || log.after != null;

    return AppCard(
      padding: const EdgeInsets.all(14),
      onTap: hasDiff ? () => setState(() => _expanded = !_expanded) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  log.action,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                ),
              ),
              StatusBadge(label: log.entityType, tone: BadgeTone.neutral),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            [
              formatDateTime(log.createdAt),
              if (log.entityId != null) "#${log.entityId}",
              if (log.ipAddress != null) log.ipAddress!,
            ].join(" · "),
            style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
          ),
          if (hasDiff) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  _expanded ? "Hide changes" : "Show changes",
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.secondary),
                ),
                Icon(
                  _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  size: 16,
                  color: AppColors.secondary,
                ),
              ],
            ),
            if (_expanded) ...[
              const SizedBox(height: 10),
              if (log.before != null) _JsonBlock(label: "Before", value: log.before!),
              if (log.before != null && log.after != null) const SizedBox(height: 8),
              if (log.after != null) _JsonBlock(label: "After", value: log.after!),
            ],
          ],
        ],
      ),
    );
  }
}

class _JsonBlock extends StatelessWidget {
  final String label;
  final Map<String, dynamic> value;
  const _JsonBlock({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 9.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.7,
            color: AppColors.mutedTextOf(context),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.subtleFillOf(context),
            borderRadius: BorderRadius.circular(10),
          ),
          child: SelectableText(
            const JsonEncoder.withIndent("  ").convert(value),
            style: TextStyle(fontSize: 11, fontFamily: "monospace", height: 1.5, color: AppColors.textOf(context)),
          ),
        ),
      ],
    );
  }
}
