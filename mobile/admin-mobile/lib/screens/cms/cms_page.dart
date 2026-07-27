import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/cms/CmsPage.tsx and its three sections
/// (CmsPagesSection, BlogSection, HeroBannersSection).
///
/// Legal pages are upserted by slug — there is no "list CMS pages" endpoint, so
/// the editor works through the fixed slug set that actually has a reader.
/// These three are the slugs public-site's CmsPage.tsx and the customer app's
/// CmsContentPage fetch; anything else would be written into the void (the
/// About page, for instance, is hardcoded copy, not a CMS row).
const _cmsPages = <(String slug, String title)>[
  ("privacy-policy", "Privacy Policy"),
  ("terms-conditions", "Terms & Conditions"),
  ("refund-policy", "Refund Policy"),
];

/// Uses the admin `manage` feed, not the public one — the public feed filters
/// to PUBLISHED, so a draft would vanish from this list the moment it was saved.
final _blogPostsProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.manageBlogPosts());
final _heroBannersProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.manageHeroBanners());

/// Named `CmsAdminPage` rather than `CmsPage` because mobile_core already
/// exports a `CmsPage` model for the page content itself.
class CmsAdminPage extends ConsumerWidget {
  const CmsAdminPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Content"),
          bottom: const TabBar(tabs: [Tab(text: "Pages"), Tab(text: "Blog"), Tab(text: "Hero banners")]),
        ),
        body: const TabBarView(children: [_PagesTab(), _BlogTab(), _HeroBannersTab()]),
      ),
    );
  }
}

class _PagesTab extends ConsumerWidget {
  const _PagesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          "Legal and informational pages rendered by the public site and the customer app. Saving publishes immediately.",
          style: TextStyle(fontSize: 12, height: 1.55, color: AppColors.mutedTextOf(context)),
        ),
        const SizedBox(height: 16),
        for (final (slug, title) in _cmsPages) ...[
          AppCard(
            padding: const EdgeInsets.all(14),
            onTap: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              useSafeArea: true,
              builder: (context) => _CmsPageEditor(slug: slug, title: title),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textOf(context)),
                      ),
                      Text("/$slug", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: AppColors.mutedTextOf(context)),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _CmsPageEditor extends ConsumerStatefulWidget {
  final String slug;
  final String title;
  const _CmsPageEditor({required this.slug, required this.title});

  @override
  ConsumerState<_CmsPageEditor> createState() => _CmsPageEditorState();
}

class _CmsPageEditorState extends ConsumerState<_CmsPageEditor> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _titleController.text = widget.title;
    _load();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  /// An unpublished page 404s — that's a blank editor, not an error.
  Future<void> _load() async {
    try {
      final page = await ref.read(marketplaceApiProvider).catalog.cmsPage(widget.slug);
      _titleController.text = page.title;
      _contentController.text = page.content;
    } on ApiException {
      // Leave the fields at their defaults so this creates the page on save.
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    try {
      await ref.read(marketplaceApiProvider).admin.upsertCmsPage(
            slug: widget.slug,
            title: _titleController.text.trim(),
            content: _contentController.text,
          );
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("${widget.title} saved")));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const SizedBox(height: 220, child: SectionLoading());

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            "Edit ${widget.title}",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
          ),
          Text("/${widget.slug}", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
          const SizedBox(height: 18),
          TextField(controller: _titleController, decoration: const InputDecoration(labelText: "Title")),
          const SizedBox(height: 12),
          TextField(
            controller: _contentController,
            maxLines: 14,
            decoration: const InputDecoration(labelText: "Content", alignLabelWithHint: true),
          ),
          const SizedBox(height: 16),
          LoadingButton(label: "Save page", onPressed: _save),
        ],
      ),
    );
  }
}

class _BlogTab extends ConsumerWidget {
  const _BlogTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(_blogPostsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        heroTag: "post",
        onPressed: () => _openEditor(context, ref, null),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(_blogPostsProvider),
        child: posts.when(
          data: (page) => page.items.isEmpty
              ? const EmptyState(icon: Icons.article_outlined, title: "No posts published yet")
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                  itemCount: page.items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final post = page.items[i];
                    return AppCard(
                      padding: const EdgeInsets.all(14),
                      onTap: () => _openEditor(context, ref, post),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  post.title,
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textOf(context),
                                  ),
                                ),
                                Text(
                                  post.publishedAt != null ? formatDate(post.publishedAt!) : "/${post.slug}",
                                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                                ),
                              ],
                            ),
                          ),
                          StatusBadge(
                            label: post.status == "PUBLISHED" ? "Published" : "Draft",
                            tone: post.status == "PUBLISHED" ? BadgeTone.success : BadgeTone.neutral,
                          ),
                        ],
                      ),
                    );
                  },
                ),
          loading: () => const SectionLoading(),
          error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_blogPostsProvider)),
        ),
      ),
    );
  }

  void _openEditor(BuildContext context, WidgetRef ref, BlogPost? post) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _BlogEditor(post: post, onSaved: () => ref.invalidate(_blogPostsProvider)),
    );
  }
}

class _BlogEditor extends ConsumerStatefulWidget {
  final BlogPost? post;
  final VoidCallback onSaved;
  const _BlogEditor({required this.post, required this.onSaved});

  @override
  ConsumerState<_BlogEditor> createState() => _BlogEditorState();
}

class _BlogEditorState extends ConsumerState<_BlogEditor> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _slug = TextEditingController(text: widget.post?.slug ?? "");
  late final TextEditingController _title = TextEditingController(text: widget.post?.title ?? "");
  late final TextEditingController _excerpt = TextEditingController(text: widget.post?.excerpt ?? "");
  late final TextEditingController _content = TextEditingController(text: widget.post?.content ?? "");
  late final TextEditingController _coverImageUrl = TextEditingController(text: widget.post?.coverImageUrl ?? "");
  late String _status = widget.post?.status == "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  @override
  void dispose() {
    _slug.dispose();
    _title.dispose();
    _excerpt.dispose();
    _content.dispose();
    _coverImageUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    try {
      await ref.read(marketplaceApiProvider).admin.upsertBlogPost(
            slug: _slug.text.trim(),
            title: _title.text.trim(),
            content: _content.text,
            excerpt: _excerpt.text.trim().isEmpty ? null : _excerpt.text.trim(),
            coverImageUrl: _coverImageUrl.text.trim().isEmpty ? null : _coverImageUrl.text.trim(),
            status: _status,
          );
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              widget.post == null ? "New post" : "Edit post",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textOf(context)),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: "Title"),
              // The slug is the upsert key, so it is only auto-filled for new
              // posts — changing it on an existing post would create a second.
              onChanged: widget.post != null
                  ? null
                  : (v) => _slug.text = v.trim().toLowerCase().replaceAll(RegExp(r"[^a-z0-9]+"), "-"),
              validator: (v) => (v ?? "").trim().isEmpty ? "Title is required" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _slug,
              readOnly: widget.post != null,
              decoration: InputDecoration(
                labelText: "Slug",
                helperText: widget.post != null ? "Slug can't change — it identifies the post" : null,
              ),
              validator: (v) => (v ?? "").trim().isEmpty ? "Slug is required" : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _excerpt,
              decoration: const InputDecoration(labelText: "Excerpt (optional)"),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _coverImageUrl,
              decoration: const InputDecoration(labelText: "Cover image URL (optional)"),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _content,
              maxLines: 12,
              decoration: const InputDecoration(labelText: "Content", alignLabelWithHint: true),
              validator: (v) => (v ?? "").trim().isEmpty ? "Content is required" : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: "Status"),
              items: const [
                DropdownMenuItem(value: "DRAFT", child: Text("Draft")),
                DropdownMenuItem(value: "PUBLISHED", child: Text("Published")),
              ],
              onChanged: (v) => setState(() => _status = v ?? "DRAFT"),
            ),
            const SizedBox(height: 18),
            LoadingButton(label: widget.post == null ? "Create post" : "Save post", onPressed: _save),
          ],
        ),
      ),
    );
  }
}

class _HeroBannersTab extends ConsumerWidget {
  const _HeroBannersTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final banners = ref.watch(_heroBannersProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_heroBannersProvider),
      child: banners.when(
        data: (list) => list.isEmpty
            ? const EmptyState(
                icon: Icons.view_carousel_outlined,
                title: "No hero banners",
                message: "The homepage falls back to its default copy while this is empty.",
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final slide = list[i];
                  return AppCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                slide.title,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textOf(context),
                                ),
                              ),
                              if (slide.subtitle != null)
                                Text(
                                  slide.subtitle!,
                                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                                ),
                              Text(
                                "Order ${slide.sortOrder}",
                                style: TextStyle(fontSize: 11, color: AppColors.mutedTextOf(context)),
                              ),
                            ],
                          ),
                        ),
                        StatusBadge(
                          label: slide.isActive ? "Active" : "Inactive",
                          tone: slide.isActive ? BadgeTone.success : BadgeTone.neutral,
                        ),
                      ],
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_heroBannersProvider)),
      ),
    );
  }
}
