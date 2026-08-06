import type { Metadata } from "next";

import { getSeoOverride, type SeoOverride } from "./seoFetch";

/**
 * Single source of truth for site-wide SEO values.
 *
 * `NEXT_PUBLIC_SITE_URL` must be the canonical production origin (no trailing
 * slash). It drives `metadataBase`, every canonical link, the sitemap, and
 * absolute Open Graph image URLs — relative OG URLs are ignored by most
 * crawlers and social scrapers, so this cannot be omitted in production.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5176").replace(/\/$/, "");

export const SITE_NAME = "RentWheels";
export const SITE_TAGLINE = "Rent vehicles from trusted local partners";

/** Primary market. Used in copy and in LocalBusiness/areaServed structured data. */
export const PRIMARY_CITY = "Chennai";
export const PRIMARY_REGION = "Tamil Nadu";
export const PRIMARY_COUNTRY = "IN";

export const DEFAULT_DESCRIPTION =
  "Book self-drive cars, bikes, and scooters from verified local rental partners in Chennai. " +
  "Transparent pricing with deposits and fees shown upfront, instant confirmation, and 24/7 support.";

export const TWITTER_HANDLE = "@rentwheels";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type BuildMetadataArgs = {
  title: string;
  description?: string;
  /** Site-relative path, e.g. `/vehicles/abc`. Becomes the canonical URL. */
  path: string;
  /** Absolute or site-relative image. Falls back to the route's generated OG image. */
  image?: string;
  /** `article` for blog posts, `website` otherwise. */
  type?: "website" | "article";
  publishedTime?: string;
  /**
   * Set for pages that must never be indexed — anything behind auth, or thin
   * utility pages that would dilute crawl budget.
   */
  noIndex?: boolean;
  keywords?: string[];
};

/**
 * Builds a complete Metadata object: canonical, Open Graph, Twitter card, and
 * robots directives. Every public page should go through this rather than
 * hand-rolling tags, so no page silently ships without a canonical or OG image.
 */
export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  type = "website",
  publishedTime,
  noIndex = false,
  keywords,
}: BuildMetadataArgs): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_IN",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * `buildMetadata` with the admin override applied.
 *
 * Field-by-field, not whole-object: an admin who sets only a title must not
 * blank out a working description. A NULL column means "keep the code default",
 * which is exactly what the backend stores for an unset field.
 *
 * Falls back silently to the code defaults if the API is unreachable — SEO
 * config must never be able to break a page render.
 */
export async function buildMetadataWithOverrides(
  args: Parameters<typeof buildMetadata>[0],
): Promise<Metadata> {
  let override: SeoOverride | null = null;
  try {
    override = await getSeoOverride(args.path);
  } catch {
    override = null;
  }
  if (!override) return buildMetadata(args);

  return buildMetadata({
    ...args,
    title: override.title?.trim() || args.title,
    description: override.description?.trim() || args.description,
    image: override.ogImageUrl?.trim() || args.image,
    keywords: override.keywords?.trim()
      ? override.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : args.keywords,
    noIndex: override.noIndex || args.noIndex,
  });
}
