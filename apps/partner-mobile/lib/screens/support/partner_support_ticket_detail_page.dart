import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _ticketProvider = FutureProvider.autoDispose.family<SupportTicket, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).support.byId(id),
);

class PartnerSupportTicketDetailPage extends ConsumerStatefulWidget {
  final String ticketId;
  const PartnerSupportTicketDetailPage({super.key, required this.ticketId});

  @override
  ConsumerState<PartnerSupportTicketDetailPage> createState() => _PartnerSupportTicketDetailPageState();
}

class _PartnerSupportTicketDetailPageState extends ConsumerState<PartnerSupportTicketDetailPage> {
  final _message = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_message.text.trim().isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ref.read(marketplaceApiProvider).support.addMessage(widget.ticketId, _message.text.trim());
      _message.clear();
      ref.invalidate(_ticketProvider(widget.ticketId));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketAsync = ref.watch(_ticketProvider(widget.ticketId));
    final myUserId = ref.watch(authControllerProvider).user?.id;

    return Scaffold(
      appBar: AppBar(title: const Text("Support ticket")),
      body: ticketAsync.when(
        data: (ticket) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(child: Text(ticket.subject, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                  StatusBadge.support(ticket.status),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: ticket.messages.length,
                itemBuilder: (context, i) {
                  final message = ticket.messages[i];
                  final isMine = message.authorId == myUserId;
                  return Align(
                    alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        color: isMine ? AppColors.accent : AppColors.primary50,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(message.message, style: TextStyle(color: isMine ? Colors.white : AppColors.primary900)),
                          const SizedBox(height: 4),
                          Text(formatDateTime(message.createdAt), style: TextStyle(fontSize: 10, color: isMine ? Colors.white70 : AppColors.primary400)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            if (ticket.status != SupportTicketStatus.closed)
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                  child: Row(
                    children: [
                      Expanded(child: TextField(controller: _message, decoration: const InputDecoration(hintText: "Type a message…"))),
                      const SizedBox(width: 8),
                      IconButton.filled(onPressed: _sending ? null : _send, icon: const Icon(Icons.send)),
                    ],
                  ),
                ),
              ),
          ],
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_ticketProvider(widget.ticketId))),
      ),
    );
  }
}
