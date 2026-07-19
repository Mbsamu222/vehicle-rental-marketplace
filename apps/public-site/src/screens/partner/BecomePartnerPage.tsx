"use client";

import { TrendingUp, LayoutGrid, Users2, ShieldCheck, Clock, ArrowRight, Star } from "lucide-react";
import { Button, Card, Eyebrow, GradientMesh, Marquee, RevealOnScroll, StarRating, Avatar } from "@vrm/ui";
import { Seo } from "@/components/Seo";

const PARTNER_WEB_URL = "http://localhost:5174";

const benefits = [
  {
    icon: TrendingUp,
    title: "Higher earnings",
    description: "List your fleet to a growing base of renters and fill idle vehicle time with new bookings.",
  },
  {
    icon: LayoutGrid,
    title: "Easy fleet management",
    description: "Manage listings, pricing, availability blocks, and documents from one partner dashboard.",
  },
  {
    icon: Users2,
    title: "Wider customer reach",
    description: "Get discovered by renters searching across your city — no marketing spend required.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & trusted",
    description: "Our verification badge builds renter trust and helps your listings convert faster.",
  },
  {
    icon: Clock,
    title: "Fast payouts",
    description: "Track bookings and revenue in real time, with payouts to your linked bank account.",
  },
];

const steps = [
  { step: "1", title: "Create your account", description: "Sign up for a free partner account in minutes." },
  { step: "2", title: "Get verified", description: "Upload your business documents for a quick verification review." },
  { step: "3", title: "List & earn", description: "Add your vehicles, set pricing, and start receiving bookings." },
];

const heroStats = [
  { value: "50+", label: "Active partners" },
  { value: "20+", label: "Neighborhoods" },
  { value: "1,000+", label: "Bookings completed" },
];

export function BecomePartnerPage() {
  return (
    <div>
      <Seo
        title="Become a Rental Partner"
        description="List your vehicles on RentWheels and reach more renters. Free to join, easy to manage."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
          <Eyebrow tone="light" className="justify-center">
            For rental businesses
          </Eyebrow>
          <h1 className="mx-auto mt-5 max-w-3xl font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Grow your rental business with RentWheels
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-white/70 sm:text-base">
            Join dozens of verified rental partners reaching thousands of renters across Chennai. List your
            fleet, set your own prices, and manage everything from one dashboard.
          </p>
          <a href={`${PARTNER_WEB_URL}/register`} className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Become a partner <ArrowRight size={18} />
            </Button>
          </a>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {heroStats.map((s) => (
              <div key={s.label}>
                <p className="font-heading text-2xl font-bold sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits — asymmetric feature grid */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <RevealOnScroll className="mb-10 text-center">
          <Eyebrow className="justify-center">Why partner with us</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Everything you need to grow</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => {
            const isFeature = i === 0;
            const Icon = b.icon;
            return (
              <RevealOnScroll key={b.title} delay={i * 0.06} className={isFeature ? "lg:col-span-2" : undefined}>
                <Card
                  className={
                    isFeature
                      ? "flex h-full flex-col justify-center overflow-hidden bg-gradient-to-br from-primary to-primary-700 p-8 text-white"
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
                  <p className={isFeature ? "mt-6 font-heading text-2xl font-bold" : "mt-4 font-heading text-base font-semibold"}>
                    {b.title}
                  </p>
                  <p className={isFeature ? "mt-2 max-w-sm text-sm text-white/70" : "mt-1.5 text-sm text-primary-400"}>
                    {b.description}
                  </p>
                </Card>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* Getting started — connected timeline */}
      <section className="bg-primary-50/50 py-20 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="text-center">
            <Eyebrow className="justify-center">Onboarding</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Getting started is simple</h2>
          </RevealOnScroll>
          <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent sm:block" />
            {steps.map((s, i) => (
              <RevealOnScroll key={s.step} delay={i * 0.1} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white shadow-soft">
                  {s.step}
                </div>
                <p className="mt-4 font-heading text-sm font-semibold">{s.title}</p>
                <p className="mt-1.5 text-xs text-primary-400">{s.description}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Partner testimonial */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <Card className="p-8 sm:p-10">
            <StarRating value={5} size={16} />
            <p className="mt-4 text-xl font-medium leading-relaxed text-primary-600 dark:text-primary-100">
              &ldquo;Since listing our fleet on RentWheels, bookings during off-peak weekdays have picked up
              significantly. The dashboard makes it easy to manage pricing and availability without any extra
              staff.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar name="Karan Shah" size={44} />
              <div>
                <p className="font-heading text-sm font-semibold">Karan Shah</p>
                <p className="text-xs text-primary-400">Owner, CityDrive Rentals — T Nagar, Chennai</p>
              </div>
            </div>
          </Card>
        </RevealOnScroll>
      </section>

      {/* Trust strip */}
      <section className="py-4 pb-10">
        <Marquee durationSeconds={22}>
          {["50+ verified partners", "Live in Chennai", "1,000+ bookings", "4.7 average rating", "24/7 partner support"].map((item) => (
            <div key={item} className="flex w-64 shrink-0 items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-primary-500 dark:border-dark-border dark:text-primary-200">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {item}
            </div>
          ))}
        </Marquee>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-primary py-20 text-center text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold">Ready to list your first vehicle?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
            It only takes a few minutes to create your partner account and start reaching renters.
          </p>
          <a href={`${PARTNER_WEB_URL}/register`} className="mt-8 inline-block">
            <Button size="lg" variant="secondary">
              Become a partner <ArrowRight size={18} />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
