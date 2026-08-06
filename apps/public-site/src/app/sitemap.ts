import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getCategories, getCities, getSitemapBlogPosts, getSitemapVehicles } from "@/lib/seoFetch";

/**
 * Served at /sitemap.xml.
 *
 * Static routes are always emitted. Dynamic entries (vehicles, blog posts, and
 * the city/category facets of search) are fetched from the API, which fails soft
 * to an empty list — a brief API outage should degrade the sitemap, not break
 * the build or serve a 500 to a crawler.
 *
 * `changeFrequency`/`priority` are advisory only; Google has said it ignores
 * them. `lastModified` is the field that actually influences recrawl, so it's
 * set from real timestamps wherever we have them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/search"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/cities"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/become-a-partner"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/support"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/careers"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms-conditions"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/refund-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [vehicles, posts, cities, categories] = await Promise.all([
    getSitemapVehicles(),
    getSitemapBlogPosts(),
    getCities(),
    getCategories(),
  ]);

  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: absoluteUrl(`/vehicles/${vehicle.id}`),
    lastModified: vehicle.createdAt ? new Date(vehicle.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Faceted search URLs are included because they are the pages that rank for
  // "rent a car in <city>" style queries. Only one facet at a time — combined
  // facets multiply into near-duplicate pages with no extra search value.
  const facetRoutes: MetadataRoute.Sitemap = [
    ...cities.map((city) => ({
      url: absoluteUrl(`/search?cityId=${city.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/search?categoryId=${category.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...vehicleRoutes, ...blogRoutes, ...facetRoutes];
}
