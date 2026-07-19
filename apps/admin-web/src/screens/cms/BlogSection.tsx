"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Newspaper, Plus } from "lucide-react";
import { useBlogPosts, useBlogPost, useUpsertBlogPost } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, FileUpload, Input, Select, Textarea, useToast } from "@vrm/ui";

export function BlogSection() {
  const { data: posts } = useBlogPosts();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: post } = useBlogPost(editingSlug ?? undefined);
  const upsertPost = useUpsertBlogPost();
  const toast = useToast();

  const { register, handleSubmit, reset, watch, setValue } = useForm<{
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    status: "DRAFT" | "PUBLISHED";
  }>({ defaultValues: { status: "DRAFT" } });
  const [coverImageUrl, setCoverImageUrl] = useState<string[]>([]);

  useEffect(() => {
    if (post) {
      reset({ slug: post.slug, title: post.title, excerpt: post.excerpt ?? "", content: post.content, status: post.status });
      setCoverImageUrl(post.coverImageUrl ? [post.coverImageUrl] : []);
    }
  }, [post, reset]);

  const startCreate = () => {
    setEditingSlug(null);
    setCreating(true);
    reset({ slug: "", title: "", excerpt: "", content: "", status: "DRAFT" });
    setCoverImageUrl([]);
  };

  const startEdit = (slug: string) => {
    setCreating(true);
    setEditingSlug(slug);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsertPost.mutateAsync({ ...values, coverImageUrl: coverImageUrl[0] });
      toast.success("Blog post saved");
      setCreating(false);
      setEditingSlug(null);
    } catch (err) {
      toast.error("Could not save post", err instanceof Error ? err.message : undefined);
    }
  });

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Newspaper size={18} /> Blog posts
        </h2>
        <Button size="sm" onClick={startCreate}>
          <Plus size={14} /> New post
        </Button>
      </div>

      {!creating ? (
        !posts?.data.length ? (
          <EmptyState title="No blog posts yet" description="Publish your first post to get started." />
        ) : (
          <div className="flex flex-col gap-2">
            {posts.data.map((p) => (
              <button
                key={p.id}
                onClick={() => startEdit(p.slug)}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-left text-sm hover:bg-primary-50 dark:border-dark-border dark:hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-primary-400">/{p.slug}</p>
                </div>
                <Badge tone={p.status === "PUBLISHED" ? "success" : "neutral"}>{p.status}</Badge>
              </button>
            ))}
          </div>
        )
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Slug" required disabled={!!editingSlug} {...register("slug", { required: true })} />
            <Select
              label="Status"
              value={watch("status")}
              onChange={(e) => setValue("status", e.target.value as "DRAFT" | "PUBLISHED")}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Published" },
              ]}
            />
          </div>
          <Input label="Title" required {...register("title", { required: true })} />
          <Textarea label="Excerpt (optional)" {...register("excerpt")} />
          <Textarea label="Content" required className="min-h-[200px]" {...register("content", { required: true })} />
          <FileUpload label="Cover image" value={coverImageUrl} onChange={setCoverImageUrl} />
          <div className="flex gap-2">
            <Button type="submit" isLoading={upsertPost.isPending}>
              Save post
            </Button>
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
