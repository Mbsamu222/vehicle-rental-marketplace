"use client";

import { useParams } from "next/navigation";
import { Link } from "@vrm/ui";
import { ArrowLeft, FileQuestion, ImageOff, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useBlogPost } from "@vrm/api-client";
import { EmptyState, PageSpinner, Button, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  if (isLoading) return <PageSpinner />;

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <Seo title="Post not found" />
        <EmptyState
          icon={<FileQuestion size={26} />}
          title="Post not found"
          description="This article may have been unpublished or the link is incorrect."
          action={
            <Link to="/blog">
              <Button variant="outline">Back to blog</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <article>
      <Seo title={post.title} description={post.excerpt ?? undefined} />

      {/* Full-bleed cover */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-primary dark:bg-dark-surface">
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={post.title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-white/30">
            <ImageOff size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">{post.title}</h1>
            {post.publishedAt && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                <Calendar size={14} /> {format(new Date(post.publishedAt), "MMMM d, yyyy")}
              </p>
            )}
          </RevealOnScroll>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        <Link to="/blog" className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
          <ArrowLeft size={14} /> Back to blog
        </Link>

        <div className="prose prose-lg max-w-none whitespace-pre-line text-[1.05rem] leading-8 text-primary-600 dark:text-primary-100">
          {post.content}
        </div>
      </div>
    </article>
  );
}
