import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Contact Us — Talk to Our Support Team",
  description:
    "Questions about a booking, a deposit, or partner onboarding? Reach the RentWheels team by email or phone, or send a message and hear back within 24 hours.",
  path: "/contact",
  keywords: ["rentwheels contact", "car rental customer care chennai"],
});

export { ContactPage as default } from "@/screens/contact/ContactPage";
