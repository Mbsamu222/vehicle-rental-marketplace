import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "About Us — Why We Built RentWheels",
  description:
    "RentWheels is a Chennai vehicle rental marketplace connecting renters with document-verified local partners. Learn our mission, story, and promise.",
  path: "/about",
  keywords: ["about rentwheels", "vehicle rental marketplace india", "self drive car company chennai"],
});

export { AboutPage as default } from "@/screens/about/AboutPage";
