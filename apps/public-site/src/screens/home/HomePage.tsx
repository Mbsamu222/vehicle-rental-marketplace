"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@vrm/ui";
import {
  Search,
  ShieldCheck,
  Wallet,
  Headset,
  Sparkles,
  MapPin,
  CreditCard,
  KeyRound,
  Route as RouteIcon,
  RotateCcw,
  Star,
  Apple,
  PlayCircle,
} from "lucide-react";
import { useCities, useVehicleCategories, useVehicleSearch } from "@vrm/api-client";
import {
  Button,
  Select,
  Card,
  EmptyState,
  SkeletonCard,
  StarRating,
  Avatar,
  Eyebrow,
  GradientMesh,
  Marquee,
  RevealOnScroll,
} from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { VehicleCard } from "@/components/VehicleCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { faqItems, testimonials, stats, howItWorksSteps, whyChooseUs } from "@/data/marketingContent";

const stepIcons = [Search, KeyRound, CreditCard, RouteIcon, RotateCcw];
const whyIcons = [ShieldCheck, Wallet, Sparkles, Headset];

const partnerChips = [
  { name: "CityDrive Rentals", city: "T Nagar", rating: 4.8 },
  { name: "SwiftWheels Co.", city: "Adyar", rating: 4.7 },
  { name: "Metro Bike Hub", city: "Velachery", rating: 4.9 },
  { name: "RoadReady Motors", city: "Anna Nagar", rating: 4.6 },
  { name: "Coastal Cruisers", city: "OMR", rating: 4.8 },
  { name: "Highway Heroes", city: "Tambaram", rating: 4.7 },
];

function parseStatValue(raw: string) {
  const match = raw.match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
  const numeric = match ? Number(match[0].replace(/,/g, "")) : 0;
  const decimals = match && match[0].includes(".") ? match[0].split(".")[1].length : 0;
  const prefix = match ? raw.slice(0, match.index) : "";
  const suffix = match ? raw.slice((match.index ?? 0) + match[0].length) : raw;
  return { numeric, decimals, prefix, suffix };
}

function StatCounter({ value }: { value: string }) {
  const { numeric, decimals, prefix, suffix } = parseStatValue(value);
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const durationMs = 1400;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(numeric * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, numeric]);

  return (
    <p ref={ref} className="font-heading text-3xl font-bold sm:text-4xl">
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </p>
  );
}

export function HomePage() {
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const navigate = useNavigate();
  const { data: cities } = useCities();
  const { data: categories } = useVehicleCategories();
  const { data: featured, isLoading: featuredLoading } = useVehicleSearch({ limit: 6, sortBy: "rating" });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (cityId) params.set("cityId", cityId);
    if (categoryId) params.set("categoryId", categoryId);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      <Seo
        title="Rent vehicles from trusted local partners"
        description="Search, compare, and book cars and bikes from verified local rental partners in Chennai."
      />

      {/* Hero */}
      <section className="relative bg-primary text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-40 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow tone="light" className="justify-center">
              Now live in Chennai — 50+ trusted rental partners
            </Eyebrow>
            <h1 className="mt-5 font-heading text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Rent smarter,
              <br />
              <span className="bg-gradient-to-r from-secondary-300 via-white to-accent-300 bg-clip-text text-transparent">
                drive further.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-white/70 sm:text-lg">
              Book cars, bikes, and more from verified local rental partners — transparent pricing, zero hassle.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold">4.7</span>
                <span className="text-white/60">average rating</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <ShieldCheck size={14} className="text-accent-300" />
                <span className="font-semibold">1,000+</span>
                <span className="text-white/60">bookings completed</span>
              </div>
            </div>
          </div>

          <RevealOnScroll delay={0.15}>
            <Card glass className="relative z-20 mx-auto -mb-24 mt-10 max-w-3xl p-4 sm:p-5 lg:-mb-32">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Select
                  placeholder="Choose a city"
                  options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                />
                <Select
                  placeholder="Vehicle category"
                  options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                />
                <Button onClick={handleSearch} size="lg" className="w-full">
                  <Search size={18} /> Search vehicles
                </Button>
              </div>
            </Card>
          </RevealOnScroll>
        </div>
      </section>

      {/* Popular Categories — horizontal icon rail */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-36">
        <RevealOnScroll className="mb-8 text-center">
          <Eyebrow className="justify-center">Browse by type</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Popular Categories</h2>
          <p className="mt-2 text-sm text-primary-400">Find the right vehicle type for your trip.</p>
        </RevealOnScroll>
        {!categories?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {categories.map((category, i) => (
              <RevealOnScroll key={category.id} delay={i * 0.04} className="snap-start">
                <Link to={`/search?categoryId=${category.id}`} className="group block w-36 sm:w-auto">
                  <Card hoverable className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary-50 to-accent-50 text-secondary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:from-secondary-500/15 dark:to-accent-500/15">
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt="" className="size-7" />
                      ) : (
                        <Sparkles size={24} />
                      )}
                    </div>
                    <p className="font-heading text-sm font-semibold">{category.name}</p>
                  </Card>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </section>

      {/* Featured Vehicles */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-8 text-center">
            <Eyebrow className="justify-center">Top rated</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Featured Vehicles</h2>
            <p className="mt-2 text-sm text-primary-400">Top-rated vehicles from our rental partners.</p>
          </RevealOnScroll>
          {featuredLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !featured?.data.length ? (
            <EmptyState
              icon={<Search size={26} />}
              title="No featured vehicles yet"
              description="Our partners are still onboarding vehicles — check back soon, or browse the full search."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.map((vehicle, i) => (
                <RevealOnScroll key={vehicle.id} delay={i * 0.06}>
                  <VehicleCard vehicle={vehicle} />
                </RevealOnScroll>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Link to="/search">
              <Button variant="outline">Browse all vehicles</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Rental Partners — static: the backend's partner-listing
          endpoint (GET /rental-partners) is admin-only, so there is no
          public API to source this from. A marquee trust strip stands in. */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-8 text-center">
            <Eyebrow className="justify-center">Social proof</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Popular Rental Partners</h2>
            <p className="mt-2 text-sm text-primary-400">Trusted businesses renting on RentWheels.</p>
          </RevealOnScroll>
        </div>
        <Marquee>
          {partnerChips.map((partner) => (
            <Card key={partner.name} className="flex w-72 shrink-0 items-center gap-4 p-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-500/15">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">{partner.name}</p>
                <p className="text-xs text-primary-400">{partner.city}</p>
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {partner.rating}
                </div>
              </div>
            </Card>
          ))}
        </Marquee>
      </section>

      {/* How It Works — connected step timeline */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-14 text-center">
            <Eyebrow className="justify-center">The process</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">How It Works</h2>
            <p className="mt-2 text-sm text-primary-400">From search to return, in five simple steps.</p>
          </RevealOnScroll>
          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent lg:block" />
            {howItWorksSteps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <RevealOnScroll key={step.title} delay={i * 0.08} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-secondary text-white shadow-soft">
                    <Icon size={22} />
                  </div>
                  <p className="mt-4 font-heading text-sm font-semibold">
                    {i + 1}. {step.title}
                  </p>
                  <p className="mt-1.5 text-xs text-primary-400">{step.description}</p>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us — bento grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll className="mb-10 text-center">
          <Eyebrow className="justify-center">Why RentWheels</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Why Choose RentWheels</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {whyChooseUs.map((item, i) => {
            const Icon = whyIcons[i];
            const isFeature = i === 0;
            return (
              <RevealOnScroll
                key={item.title}
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
                    <p className={isFeature ? "font-heading text-xl font-bold" : "font-heading text-sm font-semibold"}>
                      {item.title}
                    </p>
                    <p className={isFeature ? "mt-2 text-sm text-white/70" : "mt-1.5 text-xs text-primary-400"}>
                      {item.description}
                    </p>
                  </div>
                </Card>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-10 text-center">
            <Eyebrow className="justify-center">Testimonials</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">What Renters Say</h2>
          </RevealOnScroll>
          <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={t.name} delay={i * 0.08} className="w-[85%] shrink-0 snap-center sm:w-[60%] lg:w-auto">
                <Card className="h-full p-7">
                  <StarRating value={t.rating} size={15} />
                  <p className="mt-4 text-lg font-medium leading-relaxed text-primary-600 dark:text-primary-100">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <Avatar name={t.name} size={36} />
                    <div>
                      <p className="font-heading text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-primary-400">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="relative overflow-hidden bg-secondary py-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-noise" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat, i) => (
            <RevealOnScroll key={stat.label} delay={i * 0.08} className="text-center">
              <StatCounter value={stat.value} />
              <p className="mt-1 text-xs text-white/70">{stat.label}</p>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* Download App CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <Card className="relative flex flex-col items-center gap-6 overflow-hidden p-10 text-center lg:flex-row lg:justify-between lg:text-left">
            <GradientMesh variant="light" />
            <div className="relative">
              <h2 className="font-heading text-2xl font-bold">Take RentWheels with you</h2>
              <p className="mt-2 max-w-md text-sm text-primary-400">
                Get the app for faster bookings, live trip tracking, and exclusive mobile-only offers.
              </p>
            </div>
            <div className="relative flex flex-col gap-3 sm:flex-row">
              <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-primary">
                <Apple size={20} />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-70">Download on the</span>
                  <span className="block text-sm font-semibold">App Store</span>
                </span>
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-primary">
                <PlayCircle size={20} />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-70">Get it on</span>
                  <span className="block text-sm font-semibold">Google Play</span>
                </span>
              </button>
            </div>
          </Card>
        </RevealOnScroll>
      </section>

      {/* FAQ */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-8 text-center">
            <Eyebrow className="justify-center">Questions</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <FaqAccordion items={faqItems} />
          </RevealOnScroll>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative overflow-hidden bg-primary py-16 text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-white/10">
            <MapPin size={20} />
          </div>
          <h2 className="font-heading text-xl font-bold">Stay in the loop</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">
            Get new city launches, partner offers, and product updates in your inbox.
          </p>
          <div className="mt-6">
            <NewsletterSignup />
          </div>
        </div>
      </section>
    </div>
  );
}
