import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _ticketsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).support.mine(limit: 50));

class PartnerSupportTicketsPage extends ConsumerWidget {
  const PartnerSupportTicketsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(_ticketsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Support")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final created = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            builder: (context) => const _NewTicketSheet(),
          );
          if (created == true) ref.invalidate(_ticketsProvider);
        },
        icon: const Icon(Icons.add),
        label: const Text("New ticket"),
      ),
      body: ticketsAsync.when(
        data: (page) => page.items.isEmpty
            ? const EmptyState(icon: Icons.support_agent_outlined, title: "No support tickets")
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
                itemCount: page.items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final ticket = page.items[i];
                  return Card(
                    child: ListTile(
                      title: Text(ticket.subject, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(formatDate(ticket.createdAt)),
                      trailing: StatusBadge.support(ticket.status),
                      onTap: () => context.push("/support/${ticket.id}"),
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_ticketsProvider)),
      ),
    );
  }
}

class _NewTicketSheet extends ConsumerStatefulWidget {
  const _NewTicketSheet();

  @override
  ConsumerState<_NewTicketSheet> createState() => _NewTicketSheetState();
}

class _NewTicketSheetState extends ConsumerState<_NewTicketSheet> {
  final _subject = TextEditingController();
  final _message = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_subject.text.trim().isEmpty || _message.text.trim().isEmpty) {
      setState(() => _error = "Subject and message are required");
      return;
    }
    try {
      await ref.read(marketplaceApiProvider).support.create(subject: _subject.text.trim(), message: _message.text.trim());
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 20 + MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("New support ticket", style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            if (_error != null) ...[Text(_error!, style: const TextStyle(color: AppColors.danger)), const SizedBox(height: 12)],
            TextField(controller: _subject, decoration: const InputDecoration(labelText: "Subject")),
            const SizedBox(height: 16),
            TextField(controller: _message, maxLines: 4, decoration: const InputDecoration(labelText: "Message")),
            const SizedBox(height: 24),
            LoadingButton(label: "Submit", onPressed: _submit),
          ],
        ),
      ),
    );
  }
}
