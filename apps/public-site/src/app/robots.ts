import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Served at /robots.txt.
 *
 * Authenticated and transactional routes are disallowed: they contain no
 * indexable content, and letting crawlers spend budget on them (or surface a
 * booking checkout URL in results) is pure downside. `/search` itself stays
 * crawlable — it's a legitimate landing surface — but its query permutations are
 * not, which is why the canonical on that page points at the bare path.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/account/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/book/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
