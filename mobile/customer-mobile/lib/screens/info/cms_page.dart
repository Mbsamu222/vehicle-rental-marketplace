import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/public-site/src/screens/legal/CmsPage.tsx — the generic
/// renderer for admin-editable legal pages (privacy policy, terms, refund
/// policy).
///
/// Content is intentionally NOT hardcoded here: these pages are meant to be
/// admin-editable via the CMS, so an unpublished/404 page renders an honest
/// "not published yet" state instead of substitute text.
final cmsPageProvider = FutureProvider.autoDispose.family<CmsPage, String>(
  (ref, slug) => ref.watch(marketplaceApiProvider).catalog.cmsPage(slug),
);

class CmsContentPage extends ConsumerWidget {
  final String slug;
  final String title;
  const CmsContentPage({super.key, required this.slug, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(cmsPageProvider(slug));

    return HeroScaffold(
      eyebrow: "Legal",
      title: title,
      slivers: [
        page.when(
          data: (cms) => SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 40),
            sliver: SliverToBoxAdapter(child: CmsBody(content: cms.content)),
          ),
          loading: () => const SliverFillRemaining(hasScrollBody: false, child: SectionLoading()),
          error: (_, _) => const SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyState(
              icon: Icons.description_outlined,
              title: "This page hasn't been published yet",
              message: "Our team is still working on this content. Please check back soon.",
            ),
          ),
        ),
      ],
    );
  }
}

/// Renders CMS body text.
///
/// The CMS stores plain text and the web renders it with `whitespace-pre-line`
/// — line breaks preserved, everything one weight. That reads fine in a
/// `max-w-3xl` desktop column, but a 6,000-character policy is a wall of grey on
/// a phone. So the numbered section headings the legal pages already use
/// ("4. BOOKINGS") are promoted to real headings, and bullet lines get a hanging
/// indent. Everything else keeps its line breaks verbatim, exactly like the web,
/// so multi-line blocks such as the contact address stay on separate lines.
/// A page that doesn't follow the convention just renders as plain paragraphs.
class CmsBody extends StatelessWidget {
  final String content;
  const CmsBody({super.key, required this.content});

  /// A heading is a whole line of the form `N. TITLE IN CAPS` — deliberately
  /// strict so a sentence starting with a number is never mistaken for one.
  static final _headingPattern = RegExp(r"^\d+\.\s+[A-Z][A-Z0-9 ,&/()'’-]*$");

  static final _bulletPattern = RegExp(r"^\s*[-•]\s+");

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);
    final bodyColor = isDark ? AppColors.primary100 : AppColors.primary600;
    final bodyStyle = TextStyle(fontSize: 14.5, height: 1.75, color: bodyColor);

    // Split on blank lines so each paragraph keeps its own internal wrapping.
    final blocks = content.trim().split(RegExp(r"\n\s*\n"));
    final children = <Widget>[];

    for (final raw in blocks) {
      final block = raw.trim();
      if (block.isEmpty) continue;

      if (_headingPattern.hasMatch(block)) {
        children.add(Padding(
          padding: EdgeInsets.only(top: children.isEmpty ? 0 : 26, bottom: 10),
          child: SelectableText(
            block,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.3,
              height: 1.4,
              color: AppColors.textOf(context),
            ),
          ),
        ));
        continue;
      }

      if (block.split("\n").every((l) => l.trim().isEmpty || _bulletPattern.hasMatch(l)) &&
          _bulletPattern.hasMatch(block)) {
        for (final line in block.split("\n").where((l) => l.trim().isNotEmpty)) {
          children.add(Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 7, right: 10),
                  child: Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(color: bodyColor, shape: BoxShape.circle),
                  ),
                ),
                Expanded(
                  child: SelectableText(line.replaceFirst(_bulletPattern, ""), style: bodyStyle),
                ),
              ],
            ),
          ));
        }
        continue;
      }

      // Ordinary paragraph — line breaks kept verbatim, matching the web's
      // `whitespace-pre-line`. Prose is stored one paragraph per line, so it
      // reflows to any width on its own; deliberate breaks (the contact block)
      // survive.
      children.add(Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: SelectableText(block, style: bodyStyle),
      ));
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: children);
  }
}
