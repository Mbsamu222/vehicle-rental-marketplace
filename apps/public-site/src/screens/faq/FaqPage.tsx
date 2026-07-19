"use client";

import { Link } from "@vrm/ui";
import { RevealOnScroll } from "@vrm/ui";
import { FaqAccordion } from "@/components/FaqAccordion";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";
import { faqItems } from "@/data/marketingContent";

export function FaqPage() {
  return (
    <div>
      <Seo title="Frequently Asked Questions" description="Answers to common questions about renting on RentWheels." />

      <PageHero
        eyebrow="Support"
        title="Frequently Asked Questions"
        size="sm"
        description="Can't find what you're looking for? Reach out on our Contact page."
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <FaqAccordion items={faqItems} />
        </RevealOnScroll>
        <p className="mt-8 text-center text-sm text-primary-400">
          Still stuck?{" "}
          <Link to="/contact" className="font-semibold text-secondary hover:underline">
            Contact our team
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
