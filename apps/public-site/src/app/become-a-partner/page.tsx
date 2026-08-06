import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Become a Rental Partner — List Your Fleet",
  description:
    "List your vehicles on RentWheels and reach thousands of renters. Free to join, manage pricing and availability from one dashboard, with fast bank payouts.",
  path: "/become-a-partner",
  keywords: ["list my car for rent", "become car rental partner", "rent out my vehicle chennai", "car rental business india"],
});

export { BecomePartnerPage as default } from "@/screens/partner/BecomePartnerPage";
