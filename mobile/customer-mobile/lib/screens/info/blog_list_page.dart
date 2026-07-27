import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/blog/BlogListPage.tsx.
final _blogPostsProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).catalog.blogPosts(limit: 20));

class BlogListPage extends ConsumerWidget {
  const BlogListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(_blogPostsProvider);

    return HeroScaffold(
      eyebrow: "Journal",
      title: "The RentWheels Blog",
      description: "Rental tips, city guides, and product updates.",
      slivers: [
        posts.when(
          data: (page) => page.items.isEmpty
              ? const SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: Icons.article_outlined,
                    title: "No articles published yet",
                    message: "We're working on our first posts — check back soon.",
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
                  sliver: SliverList.separated(
                    itemCount: page.items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 14),
                    itemBuilder: (context, i) => _BlogCard(
                      post: page.items[i],
                      onTap: () => context.push("/blog/${page.items[i].slug}"),
                    ),
                  ),
                ),
          loading: () => const SliverFillRemaining(hasScrollBody: false, child: SectionLoading()),
          error: (e, _) => SliverFillRemaining(
            hasScrollBody: false,
            child: ErrorView(message: "$e", onRetry: () => ref.invalidate(_blogPostsProvider)),
          ),
        ),
      ],
    );
  }
}

class _BlogCard extends StatelessWidget {
  final BlogPost post;
  final VoidCallback onTap;
  const _BlogCard({required this.post, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final placeholder = Container(
      color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.primary50,
      alignment: Alignment.center,
      child: Icon(Icons.image_not_supported_outlined, size: 28, color: AppColors.mutedTextOf(context)),
    );

    return AppCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: post.coverImageUrl != null && post.coverImageUrl!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: post.coverImageUrl!,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    errorWidget: (_, _, _) => placeholder,
                    placeholder: (_, _) => placeholder,
                  )
                : placeholder,
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (post.publishedAt != null) ...[
                  Row(
                    children: [
                      Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.mutedTextOf(context)),
                      const SizedBox(width: 5),
                      Text(
                        formatDate(post.publishedAt!),
                        style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                Text(
                  post.title,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, height: 1.3, color: AppColors.textOf(context)),
                ),
                if (post.excerpt != null && post.excerpt!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    post.excerpt!,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.mutedTextOf(context)),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    const Text(
                      "Read more",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.link),
                    ),
                    const SizedBox(width: 5),
                    const Icon(Icons.arrow_forward, size: 14, color: AppColors.link),
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
