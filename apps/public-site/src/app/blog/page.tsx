import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Blog — Rental Tips & City Guides",
  description:
    "Practical self-drive rental advice, Chennai city guides, road-trip routes, and product updates from the RentWheels team.",
  path: "/blog",
  keywords: ["car rental blog", "chennai road trips", "self drive tips"],
});

export { BlogListPage as default } from "@/screens/blog/BlogListPage";
