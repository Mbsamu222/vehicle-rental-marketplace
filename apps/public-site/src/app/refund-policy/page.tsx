import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Refund Policy",
  description:
    "When you get money back and how long it takes: cancellation refunds, security deposit release, deductions, no-shows, and disputed charges.",
  path: "/refund-policy",
});

import { CmsPage } from "@/screens/legal/CmsPage";

export default function RefundPolicyPage() {
  return <CmsPage slug="refund-policy" title="Refund Policy" />;
}
