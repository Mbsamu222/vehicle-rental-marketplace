import { ImageResponse } from "next/og";

import { PRIMARY_CITY, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/**
 * Default social share card, generated at request time so there's no binary
 * asset to keep in sync with the brand.
 *
 * Pages that have their own imagery (a vehicle listing, a blog post with a
 * cover) override this via `openGraph.images` in their metadata; this is the
 * fallback for everything else.
 *
 * Uses only system-ish sans-serif — loading Sora/Urbanist here would mean
 * fetching font binaries on every card render for a marginal gain.
 */
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          // `primary` with the secondary -> accent brand gradient behind it,
          // matching the site header's logo treatment.
          background: "linear-gradient(135deg, #111827 0%, #1F2937 55%, #0D9488 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(45deg, #2563EB, #14B8A6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
            }}
          >
            🚗
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{SITE_NAME}</div>
        </div>

        {/* Satori requires an explicit display on any element with more than
            one child, and JSX splits `text {expr}` into two children — so the
            headline is built as a single interpolated string. */}
        <div
          style={{
            marginTop: 48,
            color: "#FFFFFF",
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          {`Self-drive cars & bikes in ${PRIMARY_CITY}`}
        </div>

        <div style={{ marginTop: 28, color: "rgba(255,255,255,0.72)", fontSize: 30, maxWidth: 860 }}>
          Verified local partners · Transparent pricing · Instant confirmation
        </div>
      </div>
    ),
    size,
  );
}
