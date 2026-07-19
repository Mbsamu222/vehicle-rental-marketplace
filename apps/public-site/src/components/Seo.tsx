"use client";

/**
 * Lightweight per-page SEO helper. React 19 hoists <title>/<meta> rendered
 * anywhere in the tree up into <head> automatically, so no extra library
 * (e.g. react-helmet) is needed.
 */
export function Seo({ title, description }: { title: string; description?: string }) {
  const fullTitle = `${title} | RentWheels`;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
    </>
  );
}
