"use client";

import { FileText } from "lucide-react";
import { useCmsPage } from "@vrm/api-client";
import { EmptyState, PageSpinner, RevealOnScroll } from "@vrm/ui";
import { PageHero } from "@/components/PageHero";

/**
 * Generic renderer for admin-editable legal pages (privacy policy, terms,
 * refund policy). Content is intentionally NOT hardcoded here — these pages
 * are meant to be admin-editable via the CMS, so an empty/404 CMS page
 * renders an honest "not published yet" state instead of substitute text.
 */
export function CmsPage({ slug, title }: { slug: string; title: string }) {
  const { data: page, isLoading, isError } = useCmsPage(slug);

  return (
    <div>
      <PageHero eyebrow="Legal" title={title} size="sm" />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <PageSpinner />
        ) : isError || !page ? (
          <EmptyState
            icon={<FileText size={26} />}
            title="This page hasn't been published yet"
            description="Our team is still working on this content. Please check back soon."
          />
        ) : (
          <RevealOnScroll>
            <article className="prose prose-lg max-w-none whitespace-pre-line leading-8 text-primary-600 dark:text-primary-100">
              {page.content}
            </article>
          </RevealOnScroll>
        )}
      </div>
    </div>
  );
}
