import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { faqItems } from "@/data/marketingContent";
import { DEFAULT_DESCRIPTION, PRIMARY_CITY, SITE_NAME, SITE_TAGLINE, absoluteUrl } from "@/lib/seo";
import { faqSchema } from "@/lib/structuredData";
import { HomePage } from "@/screens/home/HomePage";

// `absolute` bypasses the root layout's `%s | RentWheels` template, so the home
// page title doesn't render as "RentWheels — ... | RentWheels".
export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE} in ${PRIMARY_CITY}` },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE} in ${PRIMARY_CITY}`,
    description: DEFAULT_DESCRIPTION,
    locale: "en_IN",
  },
};

export default function Page() {
  return (
    <>
      {/* The home page renders the full FAQ accordion, so FAQPage markup is
          valid here as well as on /faq — the answers are visible on both. */}
      <JsonLd data={faqSchema(faqItems)} />
      <HomePage />
    </>
  );
}
