import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Customer Support — We're Here to Help",
  description:
    "Get help with bookings, payments, refunds, and account settings. Browse the RentWheels help centre or raise a support ticket, available 24/7.",
  path: "/support",
  keywords: ["car rental support", "rentwheels help"],
});

export { SupportPage as default } from "@/screens/support/SupportPage";
