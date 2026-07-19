"use client";

import { Target, Users, Globe, Heart } from "lucide-react";
import { Card, Eyebrow, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "Make vehicle rental as simple as booking a ride — transparent pricing, verified partners, and a seamless experience from search to return.",
  },
  {
    icon: Users,
    title: "Our Community",
    description:
      "We connect thousands of renters with hundreds of local rental businesses, helping small and mid-size fleets reach more customers.",
  },
  {
    icon: Globe,
    title: "Our Reach",
    description: "Live in Chennai today, with a catalog spanning cars, bikes, and scooters — more cities on the roadmap.",
  },
  {
    icon: Heart,
    title: "Our Promise",
    description: "Every partner is document-verified, every price is upfront, and every booking is backed by support.",
  },
];

const storyParagraphs = [
  "RentWheels was founded by a small team of engineers and operators who kept running into the same problem while traveling for work and leisure: finding a reliable local vehicle rental meant sifting through outdated listings, calling around for prices, and hoping the vehicle showed up as described.",
  "We built RentWheels to fix that — a single place where rental partners can list verified vehicles with real-time availability, and renters can search, compare, and book with confidence. Behind the scenes, every partner goes through a document verification process, every listing carries transparent pricing including deposits and fees, and every booking is tracked from pickup to return.",
  "We're still early in our journey, expanding city by city and category by category, but our focus hasn't changed: make renting a vehicle simple, fair, and dependable — for renters and partners alike.",
];

export function AboutPage() {
  return (
    <div>
      <Seo
        title="About Us"
        description="Learn about RentWheels' mission to connect renters with trusted local vehicle rental partners."
      />

      <PageHero
        eyebrow="About us"
        title="Renting a vehicle, reimagined"
        description="We started RentWheels with a simple idea: renting a vehicle shouldn't require phone calls, paperwork chases, or guessing at prices."
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {values.map((v, i) => {
            const isFeature = i === 0;
            const Icon = v.icon;
            return (
              <RevealOnScroll
                key={v.title}
                delay={i * 0.06}
                className={isFeature ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : "lg:col-span-2"}
              >
                <Card
                  className={
                    isFeature
                      ? "flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary-700 p-7 text-white"
                      : "h-full p-6"
                  }
                >
                  <div
                    className={
                      isFeature
                        ? "flex size-14 items-center justify-center rounded-2xl bg-white/10"
                        : "flex size-11 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15"
                    }
                  >
                    <Icon size={isFeature ? 26 : 20} />
                  </div>
                  <div className={isFeature ? "mt-8" : "mt-4"}>
                    <p className={isFeature ? "font-heading text-xl font-bold" : "font-heading text-sm font-semibold"}>{v.title}</p>
                    <p className={isFeature ? "mt-2 text-sm text-white/70" : "mt-1.5 text-xs text-primary-400"}>{v.description}</p>
                  </div>
                </Card>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <section className="bg-primary-50/50 py-20 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">How RentWheels came to be</h2>
          </RevealOnScroll>
          <div className="mt-6 space-y-4">
            {storyParagraphs.map((p, i) => (
              <RevealOnScroll key={i} delay={i * 0.08}>
                <p className="text-sm leading-relaxed text-primary-500 dark:text-primary-200">{p}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
