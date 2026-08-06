import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Careers — Join the RentWheels Team",
  description:
    "We're building the easiest way to rent a vehicle in India. See open engineering, operations, design, and support roles at RentWheels.",
  path: "/careers",
  keywords: ["rentwheels careers", "startup jobs chennai"],
});

export { CareersPage as default } from "@/screens/careers/CareersPage";
