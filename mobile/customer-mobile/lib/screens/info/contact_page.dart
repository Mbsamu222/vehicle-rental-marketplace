import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/contact/ContactPage.tsx — same dark
/// info panel, same field set, same copy.
///
/// One deliberate difference: the web form has no endpoint behind it (it fakes
/// a 400ms delay and shows "Message Received"). The app is signed-in, so the
/// same form files a real support ticket via POST /support-tickets and lands
/// the user on the thread. Signed-out users are sent to login rather than
/// shown a confirmation for a message nothing received — the email and phone
/// rows above stay tappable as the always-open channel.
class ContactPage extends ConsumerStatefulWidget {
  const ContactPage({super.key});

  @override
  ConsumerState<ContactPage> createState() => _ContactPageState();
}

class _ContactPageState extends ConsumerState<ContactPage> {
  final _formKey = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _message = TextEditingController();

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (!ref.read(authControllerProvider).isAuthenticated) {
      if (!mounted) return;
      context.push("/login?redirect=${Uri.encodeComponent("/contact")}");
      return;
    }

    try {
      final ticket = await ref.read(marketplaceApiProvider).support.create(
            subject: _subject.text.trim(),
            message: _message.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Message sent — we'll reply on this ticket.")),
      );
      context.pushReplacement("/account/support/${ticket.id}");
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = ref.watch(authControllerProvider).isAuthenticated;

    return HeroScaffold(
      eyebrow: "Get in touch",
      title: "Let's talk",
      description:
          "Questions about a vehicle booking, partner onboarding, or customer support? Send us a message and our team will get back to you within 24 hours.",
      heroChild: Column(
        children: [
          for (final detail in MarketingContent.contactDetails)
            _ContactRow(detail: detail),
        ],
      ),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Send us a message",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    signedIn
                        ? "This opens a support ticket you can track from your account."
                        : "Sign in to send a message our team can reply to.",
                    style: TextStyle(fontSize: 12.5, color: AppColors.mutedTextOf(context)),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _subject,
                    decoration: const InputDecoration(
                      labelText: "Subject",
                      hintText: "Booking Inquiry / Feedback",
                    ),
                    validator: (v) => (v ?? "").trim().length < 3 ? "Subject is too short" : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _message,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: "Message",
                      hintText: "How can we help you today?",
                      alignLabelWithHint: true,
                    ),
                    validator: (v) =>
                        (v ?? "").trim().length < 10 ? "Tell us a bit more (at least 10 characters)" : null,
                  ),
                  const SizedBox(height: 20),
                  LoadingButton(
                    label: signedIn ? "Send Message" : "Sign in to send",
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ContactRow extends StatelessWidget {
  final ContactDetail detail;
  const _ContactRow({required this.detail});

  @override
  Widget build(BuildContext context) {
    final row = Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          IconTile(
            icon: detail.icon,
            background: Colors.white.withValues(alpha: 0.1),
            foreground: AppColors.accent,
            size: 42,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  detail.label.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  detail.value,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                ),
              ],
            ),
          ),
          if (detail.launchUrl != null)
            Icon(Icons.open_in_new, size: 16, color: Colors.white.withValues(alpha: 0.6)),
        ],
      ),
    );

    if (detail.launchUrl == null) return row;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => launchExternalUrl(detail.launchUrl!),
        child: row,
      ),
    );
  }
}
