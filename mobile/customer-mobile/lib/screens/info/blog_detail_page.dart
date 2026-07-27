import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/blog/BlogDetailPage.tsx — full-bleed
/// cover with the title overlaid, then the article body. Like the web, the
/// body is plain text rendered with line breaks preserved (the CMS stores it
/// that way; there is no markup to parse).
final blogPostProvider = FutureProvider.autoDispose.family<BlogPost, String>(
  (ref, slug) => ref.watch(marketplaceApiProvider).catalog.blogPost(slug),
);

class BlogDetailPage extends ConsumerWidget {
  final String slug;
  const BlogDetailPage({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final post = ref.watch(blogPostProvider(slug));

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
      ),
      body: post.when(
        data: (article) => CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _Cover(post: article)),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextButton.icon(
                      onPressed: () => context.canPop() ? context.pop() : context.push("/blog"),
                      icon: const Icon(Icons.arrow_back, size: 15),
                      label: const Text("Back to blog"),
                      style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    ),
                    const SizedBox(height: 12),
                    SelectableText(
                      article.content,
                      style: TextStyle(
                        fontSize: 15,
                        height: 1.75,
                        color: AppColors.isDark(context) ? AppColors.primary100 : AppColors.primary600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => Padding(
          padding: const EdgeInsets.all(24),
          child: EmptyState(
            icon: Icons.help_outline,
            title: "Post not found",
            message: "This article may have been unpublished or the link is incorrect.",
            action: OutlinedButton(
              onPressed: () => context.canPop() ? context.pop() : context.push("/blog"),
              child: const Text("Back to blog"),
            ),
          ),
        ),
      ),
    );
  }
}

class _Cover extends StatelessWidget {
  final BlogPost post;
  const _Cover({required this.post});

  @override
  Widget build(BuildContext context) {
    final base = AppColors.isDark(context) ? AppColors.darkSurface : AppColors.primary900;

    return AspectRatio(
      aspectRatio: 16 / 10,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            color: base,
            alignment: Alignment.center,
            child: Icon(Icons.image_not_supported_outlined, size: 40, color: Colors.white.withValues(alpha: 0.3)),
          ),
          if (post.coverImageUrl != null && post.coverImageUrl!.isNotEmpty)
            CachedNetworkImage(
              imageUrl: post.coverImageUrl!,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => const SizedBox.shrink(),
            ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  AppColors.primary900.withValues(alpha: 0.85),
                  AppColors.primary900.withValues(alpha: 0.15),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  post.title,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, height: 1.2, color: Colors.white),
                ),
                if (post.publishedAt != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.calendar_today_outlined, size: 13, color: Colors.white.withValues(alpha: 0.7)),
                      const SizedBox(width: 6),
                      Text(
                        formatDate(post.publishedAt!),
                        style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.7)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
