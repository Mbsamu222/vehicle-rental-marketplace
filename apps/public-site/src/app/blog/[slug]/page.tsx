import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { buildMetadata } from "@/lib/seo";
import { getBlogPost } from "@/lib/seoFetch";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/structuredData";
import { BlogDetailPage } from "@/screens/blog/BlogDetailPage";

type Props = { params: Promise<{ slug: string }> };

/** Meta descriptions truncate around 160 characters in most SERPs, so an
 * excerpt-less post derives one from the opening of its body. */
function deriveDescription(post: { excerpt?: string | null; content: string }): string {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const firstParagraph = post.content.split(/\n\s*\n/)[0]?.replace(/\s+/g, " ").trim() ?? "";
  return firstParagraph.length > 157 ? `${firstParagraph.slice(0, 157)}…` : firstParagraph;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return buildMetadata({ title: "Post not found", path: `/blog/${slug}`, noIndex: true });
  }

  return buildMetadata({
    title: post.title,
    description: deriveDescription(post),
    path: `/blog/${post.slug}`,
    image: post.coverImageUrl ?? undefined,
    type: "article",
    publishedTime: post.publishedAt ?? undefined,
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const path = `/blog/${slug}`;

  return (
    <>
      {post && (
        <JsonLd
          data={[
            blogPostingSchema(post, path),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title, path },
            ]),
          ]}
        />
      )}
      <BlogDetailPage />
    </>
  );
}
