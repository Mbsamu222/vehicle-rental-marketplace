import type { MetadataRoute } from "next";

/**
 * This console is entirely behind authentication and has no public surface, so
 * everything is disallowed. Paired with a site-wide `noindex` in layout.tsx —
 * robots.txt stops crawling, the meta tag stops indexing of anything already
 * discovered via an external link.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
