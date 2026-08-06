import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Privacy Policy",
  description:
    "How RentWheels collects, uses, shares, and retains your personal data — including driving licence images, payment records, and your privacy rights.",
  path: "/privacy-policy",
});

import { CmsPage } from "@/screens/legal/CmsPage";

export default function PrivacyPolicyPage() {
  return <CmsPage slug="privacy-policy" title="Privacy Policy" />;
}
