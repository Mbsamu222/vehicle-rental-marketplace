"use client";

import { Link } from "@vrm/ui";
import { Newspaper, ImageOff, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useBlogPosts } from "@vrm/api-client";
import { Card, EmptyState, SkeletonCard, RevealOnScroll } from "@vrm/ui";
import { PageHero } from "@/components/PageHero";

export function BlogListPage() {
  const { data: posts, isLoading } = useBlogPosts();

  return (
    <div>
      <PageHero eyebrow="Journal" title="The RentWheels Blog" description="Rental tips, city guides, and product updates." size="sm" />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !posts?.data.length ? (
          <EmptyState
            icon={<Newspaper size={26} />}
            title="No articles published yet"
            description="We're working on our first posts — check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.data.map((post, i) => (
              <RevealOnScroll key={post.id} delay={i * 0.06}>
                <Link to={`/blog/${post.slug}`}>
                  <Card hoverable className="group h-full overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-primary-50 dark:bg-white/5">
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-primary-300">
                          <ImageOff size={28} />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {post.publishedAt && (
                        <p className="mb-2 flex items-center gap-1.5 text-xs text-primary-400">
                          <Calendar size={12} /> {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                        </p>
                      )}
                      <p className="font-heading text-base font-semibold">{post.title}</p>
                      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-primary-400">{post.excerpt}</p>}
                      <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-link">
                        Read more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </p>
                    </div>
                  </Card>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
