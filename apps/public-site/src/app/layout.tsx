import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { PublicLayout } from "@/layout/PublicLayout";
import { JsonLd } from "@/components/JsonLd";
import {
  DEFAULT_DESCRIPTION,
  PRIMARY_CITY,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/seo";
import { organizationSchema, websiteSchema } from "@/lib/structuredData";
import "./globals.css";

export const metadata: Metadata = {
  // Required for relative Open Graph and canonical URLs to resolve to absolute
  // ones. Without it Next emits relative OG URLs, which social scrapers drop.
  metadataBase: new URL(SITE_URL),

  // `%s` is filled by each page's `title`. The home page sets `absolute` so it
  // doesn't render as "RentWheels | RentWheels".
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "self drive car rental",
    `car rental ${PRIMARY_CITY}`,
    `bike rental ${PRIMARY_CITY}`,
    "self drive cars",
    "scooter rental",
    "rent a car without driver",
    "vehicle rental marketplace",
    "monthly car rental",
  ],
  category: "travel",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", site: TWITTER_HANDLE, creator: TWITTER_HANDLE },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Site-wide entities, emitted once here rather than per page so the
            Organization and WebSite nodes have one stable @id to resolve to. */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
      </head>
      <body>
        <Providers>
          <PublicLayout>{children}</PublicLayout>
        </Providers>
      </body>
    </html>
  );
}
