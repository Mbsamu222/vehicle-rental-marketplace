"use client";

import { TrendingUp, LayoutGrid, Users2, ShieldCheck, Clock, ArrowRight, Star } from "lucide-react";
import { Button, Card, Eyebrow, GradientMesh, Marquee, RevealOnScroll, StarRating, Avatar } from "@vrm/ui";
import { Seo } from "@/components/Seo";

const PARTNER_WEB_URL = "http://localhost:5174";

const benefits = [
  {
    icon: TrendingUp,
    title: "Higher Earnings",
    description: "List your fleet to a growing base of renters and fill idle vehicle time with high-converting bookings.",
  },
  {
    icon: LayoutGrid,
    title: "Easy Fleet Management",
    description: "Manage listings, pricing, availability blocks, and vehicle documents from one partner dashboard.",
  },
  {
    icon: Users2,
    title: "Wider Customer Reach",
    description: "Get discovered by renters searching across your city — zero marketing or setup spend required.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & Trusted",
    description: "Our partner verification badge builds instant renter trust and helps your listings convert faster.",
  },
  {
    icon: Clock,
    title: "Fast Bank Payouts",
    description: "Track bookings and revenue in real time, with payouts directly to your linked bank account.",
  },
];

const steps = [
  { step: "1", title: "Create Your Account", description: "Sign up for a free partner account in under two minutes." },
  { step: "2", title: "Get Verified", description: "Upload your business documents for a quick verification review." },
  { step: "3", title: "List & Start Earning", description: "Add your vehicles, set your daily rates, and start receiving bookings." },
];

const heroStats = [
  { value: "50+", label: "Active partners" },
  { value: "20+", label: "Neighborhoods" },
  { value: "1,000+", label: "Bookings completed" },
];

export function BecomePartnerPage() {
  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <Seo
        title="Become a Rental Partner"
        description="List your vehicles on RentWheels and reach more renters. Free to join, easy to manage."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 rounded-full bg-secondary/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
          <Eyebrow tone="light" className="justify-center">
            For Rental Businesses
          </Eyebrow>
          <h1 className="mx-auto mt-5 max-w-3xl font-heading text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Grow Your Rental Business with RentWheels
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Join dozens of verified rental partners reaching thousands of renters across Chennai. List your fleet, set your own prices, and manage everything from one unified dashboard.
          </p>
          <a href={`${PARTNER_WEB_URL}/register`} className="mt-8 inline-block">
            <Button
              size="lg"
              className="gap-2 !bg-white !text-primary font-heading shadow-soft hover:-translate-y-0.5 hover:shadow-card active:translate-y-0"
            >
              Become a Partner <ArrowRight size={18} />
            </Button>
          </a>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {heroStats.map((s) => (
              <div key={s.label}>
                <p className="font-heading text-2xl font-black text-white sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-white/60 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits — Clean 5-card grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll className="mb-10 text-center">
          <Eyebrow className="justify-center">Partner Benefits</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">Everything You Need to Grow</h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <RevealOnScroll key={b.title} delay={i * 0.06}>
                <Card hoverable className="flex flex-col h-full p-6 shadow-soft transition-all duration-300 hover:-translate-y-1">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300 mb-5">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-heading text-base font-bold text-primary dark:text-white">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-primary-400">
                    {b.description}
                  </p>
                </Card>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* Getting Started Step Timeline */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="text-center">
            <Eyebrow className="justify-center">Onboarding Process</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">Getting Started is Simple</h2>
          </RevealOnScroll>
          <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent sm:block" />
            {steps.map((s, i) => (
              <RevealOnScroll key={s.step} delay={i * 0.1} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-primary text-white font-heading text-sm font-bold shadow-soft dark:bg-white dark:text-primary">
                  {s.step}
                </div>
                <h3 className="mt-4 font-heading text-base font-bold text-primary dark:text-white">{s.title}</h3>
                <p className="mt-1.5 text-xs text-primary-400 leading-relaxed">{s.description}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Testimonial */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <Card className="p-8 sm:p-10 shadow-soft border border-border">
            <StarRating value={5} size={16} />
            <p className="mt-4 text-lg font-medium leading-relaxed text-primary-700 dark:text-primary-100 italic">
              &ldquo;Since listing our fleet on RentWheels, bookings during off-peak weekdays have picked up significantly. The dashboard makes it easy to manage pricing and availability without extra staff.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3.5 border-t border-border/60 pt-5 dark:border-white/10">
              <Avatar name="Karan Shah" size={44} />
              <div>
                <p className="font-heading text-sm font-bold text-primary dark:text-white">Karan Shah</p>
                <p className="text-xs text-primary-400">Owner, CityDrive Rentals — T Nagar, Chennai</p>
              </div>
            </div>
          </Card>
        </RevealOnScroll>
      </section>

      {/* Closing CTA */}
      <section className="relative overflow-hidden bg-primary py-16 text-center text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-extrabold">Ready to List Your First Vehicle?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/75 leading-relaxed">
            It only takes a few minutes to create your partner account and start reaching renters across Chennai.
          </p>
          <a href={`${PARTNER_WEB_URL}/register`} className="mt-8 inline-block">
            <Button
              size="lg"
              className="gap-2 !bg-white !text-primary font-heading shadow-soft hover:-translate-y-0.5 hover:shadow-card active:translate-y-0"
            >
              Become a Partner <ArrowRight size={18} />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
