import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Search Self-Drive Cars & Bikes",
  description:
    "Compare available self-drive cars, bikes, and scooters by city, category, and price. Transparent totals with deposits and fees shown before you book.",
  path: "/search",
  keywords: ["search self drive cars", "compare car rental prices chennai", "book bike rental"],
});

export { SearchPage as default } from "@/screens/search/SearchPage";
