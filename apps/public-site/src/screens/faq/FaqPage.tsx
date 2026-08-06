"use client";

import { Link } from "@vrm/ui";
import { RevealOnScroll, Card } from "@vrm/ui";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PageHero } from "@/components/PageHero";
import { faqItems } from "@/data/marketingContent";

export function FaqPage() {
  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <PageHero
        eyebrow="Help & FAQ"
        title="Frequently Asked Questions"
        size="sm"
        description="Everything you need to know about vehicle bookings, security deposits, driving requirements, and partner onboarding."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <Card className="p-6 sm:p-8 shadow-soft border border-border">
            <FaqAccordion items={faqItems} />
          </Card>
        </RevealOnScroll>

        <div className="mt-10 text-center text-sm text-primary-400">
          <p>
            Still have questions?{" "}
            <Link to="/contact" className="font-bold text-secondary hover:underline dark:text-accent-300">
              Contact our 24/7 Support Team →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
