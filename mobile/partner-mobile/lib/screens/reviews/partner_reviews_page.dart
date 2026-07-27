import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

import '../../providers/partner_profile_provider.dart';

final _reviewsProvider = FutureProvider.autoDispose.family<List<Review>, String>(
  (ref, partnerId) => ref.watch(marketplaceApiProvider).reviews.forPartner(partnerId),
);

class PartnerReviewsPage extends ConsumerWidget {
  const PartnerReviewsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(partnerProfileProvider);
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: DashboardTopBar(
        title: "Reviews",
        userName: user?.fullName,
        onSettings: () => context.push("/profile"),
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: profileAsync.when(
        data: (profile) {
          if (profile == null) return const SizedBox.shrink();
          final reviewsAsync = ref.watch(_reviewsProvider(profile.id));
          return reviewsAsync.when(
            data: (reviews) => reviews.isEmpty
                ? const EmptyState(icon: Icons.star_border, title: "No reviews yet")
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: reviews.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, i) => _ReviewCard(review: reviews[i], partnerId: profile.id),
                  ),
            loading: () => const SectionLoading(),
            error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_reviewsProvider(profile.id))),
          );
        },
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e"),
      ),
    );
  }
}

class _ReviewCard extends ConsumerStatefulWidget {
  final Review review;
  final String partnerId;
  const _ReviewCard({required this.review, required this.partnerId});

  @override
  ConsumerState<_ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends ConsumerState<_ReviewCard> {
  bool _replying = false;
  final _replyController = TextEditingController();

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _submitReply() async {
    if (_replyController.text.trim().isEmpty) return;
    await ref.read(marketplaceApiProvider).reviews.reply(widget.review.id, _replyController.text.trim());
    ref.invalidate(_reviewsProvider(widget.partnerId));
  }

  @override
  Widget build(BuildContext context) {
    final review = widget.review;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(review.customer?.fullName ?? "Customer", style: const TextStyle(fontWeight: FontWeight.w700))),
                StarRatingDisplay(rating: review.partnerRating.toDouble(), size: 14),
              ],
            ),
            if (review.comment != null) ...[
              const SizedBox(height: 8),
              Text(review.comment!),
            ],
            if (review.replies.isNotEmpty) ...[
              const SizedBox(height: 12),
              for (final reply in review.replies)
                Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.subtleFillOf(context), borderRadius: BorderRadius.circular(10)),
                  child: Text(reply.message),
                ),
            ],
            if (review.replies.isEmpty) ...[
              const SizedBox(height: 8),
              if (_replying)
                Row(
                  children: [
                    Expanded(child: TextField(controller: _replyController, decoration: const InputDecoration(hintText: "Write a reply…"))),
                    IconButton(onPressed: _submitReply, icon: const Icon(Icons.send)),
                  ],
                )
              else
                TextButton(onPressed: () => setState(() => _replying = true), child: const Text("Reply")),
            ],
          ],
        ),
      ),
    );
  }
}
