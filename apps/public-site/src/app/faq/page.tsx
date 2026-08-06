import { buildMetadataWithOverrides } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { faqItems } from "@/data/marketingContent";
import { faqSchema } from "@/lib/structuredData";
import { FaqPage } from "@/screens/faq/FaqPage";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Frequently Asked Questions",
  description:
    "Answers on booking a self-drive vehicle, driving licence requirements, refundable security deposits, cancellation rules, payments, and partner onboarding.",
  path: "/faq",
  keywords: ["car rental faq", "self drive car requirements", "security deposit car rental", "driving licence rental"],
});

export default function Page() {
  return (
    <>
      {/* Eligible for the FAQ rich result — every Q&A here is visible on the page. */}
      <JsonLd data={faqSchema(faqItems)} />
      <FaqPage />
    </>
  );
}
