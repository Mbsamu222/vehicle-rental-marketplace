/**
 * Server-side reads used by `generateMetadata` and `sitemap.ts`.
 *
 * Deliberately native `fetch` rather than the shared axios client in
 * `@vrm/api-client`: this runs on the server during rendering and at build
 * time, where we want Next's fetch cache and revalidation, and where the axios
 * client's auth interceptors have no session to attach.
 *
 * Every helper FAILS SOFT and returns null/[] — a metadata or sitemap request
 * must never take down a page render or break a production build just because
 * the API is briefly unreachable.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Metadata and sitemaps tolerate staleness; an hour keeps crawl data fresh
 * without hammering the API on every crawler hit. */
const REVALIDATE_SECONDS = 3600;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { success?: boolean; data?: T };
    if (body?.success === false) return null;
    return (body?.data ?? null) as T | null;
  } catch {
    // Network error, DNS failure, API down — callers degrade gracefully.
    return null;
  }
}

export type SeoVehicle = {
  id: string;
  model: string;
  year: number;
  pricePerDay: string | number;
  pricePerHour?: string | number;
  securityDeposit?: string | number;
  seatingCapacity?: number;
  transmission?: string;
  fuelType?: string;
  averageRating?: string | number;
  totalReviews?: number;
  registrationNumber?: string;
  brand?: { name: string } | null;
  category?: { name: string; slug?: string } | null;
  city?: { name: string } | null;
  rentalPartner?: { businessName: string } | null;
  images?: { url: string; isPrimary?: boolean }[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt?: string;
};

export type SeoBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
};

type SeoCity = { id: string; name: string; imageUrl?: string | null };
type SeoCategory = { id: string; name: string; slug: string };

export const getVehicle = (id: string) => getJson<SeoVehicle>(`/vehicles/${id}`);
export const getBlogPost = (slug: string) => getJson<SeoBlogPost>(`/admin/blog/${slug}`);

export async function getCities(): Promise<SeoCity[]> {
  return (await getJson<SeoCity[]>("/catalog/cities")) ?? [];
}

export async function getCategories(): Promise<SeoCategory[]> {
  return (await getJson<SeoCategory[]>("/catalog/vehicle-categories")) ?? [];
}

/** Paginated endpoints return `{data, meta}`; the envelope unwrap above yields
 * the array directly for `data`, so a paginated call needs its own shape. */
async function getPaginated<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { success?: boolean; data?: T[] };
    if (body?.success === false) return [];
    return body?.data ?? [];
  } catch {
    return [];
  }
}

/** Indexable vehicle listings. Capped because a sitemap must stay under
 * 50,000 URLs / 50MB; beyond that the sitemap needs splitting into an index. */
export const getSitemapVehicles = () => getPaginated<SeoVehicle>("/vehicles?page=1&limit=1000");

export const getSitemapBlogPosts = () => getPaginated<SeoBlogPost>("/admin/blog?page=1&limit=500");

/** Primary image for OG tags, preferring the one flagged primary. */
export function primaryImageUrl(vehicle: SeoVehicle): string | undefined {
  if (!vehicle.images?.length) return undefined;
  return (vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0]).url;
}

export function vehicleTitle(vehicle: SeoVehicle): string {
  return [vehicle.brand?.name, vehicle.model, vehicle.year ? `(${vehicle.year})` : null]
    .filter(Boolean)
    .join(" ");
}

/** Admin-managed meta override for one route (backend `seo_settings`). */
export type SeoOverride = {
  path: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogImageUrl?: string | null;
  noIndex?: boolean;
};

/**
 * All admin SEO overrides, keyed by path.
 *
 * Fetched as one list rather than per-route because there are only a handful of
 * rows and Next dedupes+caches the single request across every page rendered in
 * the same pass — far cheaper than N lookups during a full static build.
 */
export async function getSeoOverrides(): Promise<Map<string, SeoOverride>> {
  const rows = (await getJson<SeoOverride[]>("/admin/seo")) ?? [];
  return new Map(rows.map((r) => [r.path, r]));
}

export async function getSeoOverride(path: string): Promise<SeoOverride | null> {
  return (await getSeoOverrides()).get(path) ?? null;
}
