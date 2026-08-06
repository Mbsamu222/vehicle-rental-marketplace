import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Terms & Conditions",
  description:
    "The terms governing use of the RentWheels marketplace: eligibility, bookings, pricing and deposits, cancellations, vehicle use, and liability.",
  path: "/terms-conditions",
});

import { CmsPage } from "@/screens/legal/CmsPage";

export default function TermsConditionsPage() {
  return <CmsPage slug="terms-conditions" title="Terms & Conditions" />;
}
