/**
 * schema.org JSON-LD builders.
 *
 * Only claims that are actually true of the rendered page are emitted —
 * structured data that misrepresents the page is a manual-action risk with
 * Google, not a ranking shortcut. In particular `aggregateRating` is omitted
 * entirely when a vehicle has no reviews, rather than being sent as 0.
 */

import {
  DEFAULT_DESCRIPTION,
  PRIMARY_CITY,
  PRIMARY_COUNTRY,
  PRIMARY_REGION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "./seo";
import { primaryImageUrl, vehicleTitle, type SeoBlogPost, type SeoVehicle } from "./seoFetch";

type Json = Record<string, unknown>;

/** Stable @id so separate nodes across pages resolve to one entity. */
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * `AutoRental` is the precise schema.org type for a vehicle rental business and
 * is a subtype of LocalBusiness, so it inherits address/geo support while being
 * more specific than a bare Organization.
 */
export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "AutoRental"],
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png") },
    address: {
      "@type": "PostalAddress",
      addressLocality: PRIMARY_CITY,
      addressRegion: PRIMARY_REGION,
      addressCountry: PRIMARY_COUNTRY,
    },
    areaServed: { "@type": "City", name: PRIMARY_CITY },
    priceRange: "₹₹",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@rentwheels.example",
      availableLanguage: ["en", "ta"],
      areaServed: PRIMARY_COUNTRY,
    },
  };
}

/**
 * WebSite node with a SearchAction, which is what makes a sitelinks search box
 * eligible. The target must match a real, crawlable search URL — ours is
 * `/search?q=`, handled by the search page.
 */
export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * A rentable vehicle as a `Car` with an `Offer`.
 *
 * `businessFunction: LeaseOut` is the correct GoodRelations value for rental
 * rather than sale — without it, the offer reads as an outright purchase at the
 * daily rate, which would be misleading in search results.
 */
export function vehicleSchema(vehicle: SeoVehicle, path: string): Json {
  const title = vehicleTitle(vehicle);
  const image = primaryImageUrl(vehicle);
  const rating = Number(vehicle.averageRating ?? 0);
  const reviewCount = Number(vehicle.totalReviews ?? 0);

  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: title,
    url: absoluteUrl(path),
    ...(image ? { image: [absoluteUrl(image)] } : {}),
    ...(vehicle.brand?.name ? { brand: { "@type": "Brand", name: vehicle.brand.name } } : {}),
    ...(vehicle.model ? { model: vehicle.model } : {}),
    ...(vehicle.year ? { vehicleModelDate: String(vehicle.year) } : {}),
    ...(vehicle.seatingCapacity
      ? { vehicleSeatingCapacity: { "@type": "QuantitativeValue", value: vehicle.seatingCapacity } }
      : {}),
    ...(vehicle.transmission ? { vehicleTransmission: vehicle.transmission } : {}),
    ...(vehicle.fuelType ? { fuelType: vehicle.fuelType } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: Number(vehicle.pricePerDay),
      // Rental, not sale.
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(path),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: Number(vehicle.pricePerDay),
        priceCurrency: "INR",
        unitCode: "DAY",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "DAY" },
      },
      ...(vehicle.rentalPartner?.businessName
        ? { seller: { "@type": "Organization", name: vehicle.rentalPartner.businessName } }
        : {}),
      ...(vehicle.city?.name
        ? { areaServed: { "@type": "City", name: vehicle.city.name } }
        : {}),
    },
  };

  // Only assert a rating when one genuinely exists — Google rejects (and may
  // penalise) aggregateRating with a zero or absent reviewCount.
  if (reviewCount > 0 && rating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.toFixed(1)),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function blogPostingSchema(post: SeoBlogPost, path: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    url: absoluteUrl(path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    ...(post.coverImageUrl ? { image: [absoluteUrl(post.coverImageUrl)] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt, dateModified: post.publishedAt } : {}),
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

