import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Where We Operate — Cities We Cover",
  description:
    "See every neighbourhood RentWheels serves. Live across Chennai today with self-drive cars and bikes from verified local rental partners nearby.",
  path: "/cities",
  keywords: ["car rental cities", "self drive car chennai locations", "bike rental near me"],
});

export { CitiesPage as default } from "@/screens/cities/CitiesPage";
