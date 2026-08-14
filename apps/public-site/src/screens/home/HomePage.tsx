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
  Car,
  Bike,
  ArrowRight,
  CheckCircle2,
  Mail,
  UserCheck,
  Clock,
  ThumbsUp,
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
import { VehicleCard } from "@/components/VehicleCard";
import { FaqAccordion } from "@/components/FaqAccordion";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { HeroSlider } from "@/components/HeroSlider";
import { SponsoredBanner } from "@/components/SponsoredBanner";
import { AdSlotsBand } from "@/components/AdSlotsBand";
import { faqItems, testimonials, stats, howItWorksSteps, whyChooseUs } from "@/data/marketingContent";
import { getCategoryIcon, getCategoryColorStyle } from "@/utils/categoryIcons";

const stepIcons = [Search, KeyRound, CreditCard, RouteIcon, RotateCcw];
const whyIcons = [UserCheck, Wallet, Sparkles, Headset];

/** Solid Apple mark, matching the glyph used on the real App Store badge. */
function AppleMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.415 2.19-1.238 3.02-.902.91-2.03 1.44-3.02 1.36-.12-1.13.42-2.28 1.24-3.09.9-.93 2.13-1.47 3.02-1.29zM19.9 17.5c-.53 1.23-.79 1.78-1.47 2.87-.95 1.52-2.28 3.41-3.94 3.42-1.47.02-1.85-.96-3.84-.95-1.99.01-2.4.97-3.87.95-1.66-.02-2.92-1.73-3.87-3.24C.5 17.1-.24 12.62 1.4 9.53c1.16-2.19 3.08-3.47 4.9-3.47 1.85 0 3.01 1 4.54 1 1.48 0 2.38-1 4.53-1 1.6 0 3.3.87 4.5 2.38-3.96 2.17-3.32 7.84.03 9.06z" />
    </svg>
  );
}

/** Google Play mark: official multi-colored Play triangle. */
function GooglePlayMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.609 1.814C3.232 2.213 3 2.809 3 3.585v16.83c0 .776.232 1.372.609 1.771l.092.086L13.19 12.78v-1.56L3.701 1.728l-.092.086z"
        fill="#00D66B"
      />
      <path
        d="M16.35 15.942l-3.16-3.162v-1.56l3.16-3.162.072.041 3.743 2.127c1.069.607 1.069 1.6 0 2.207l-3.743 2.127-.072.042z"
        fill="#FFC107"
      />
      <path
        d="M16.422 15.9l-3.232-3.232-9.489 9.489c.353.376.938.423 1.564.068l11.157-6.325"
        fill="#FF3D00"
      />
      <path
        d="M16.422 8.1l-11.157-6.325c-.626-.355-1.211-.308-1.564.068l9.489 9.489L16.422 8.1z"
        fill="#0288D1"
      />
    </svg>
  );
}

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
    <p ref={ref} className="font-heading text-4xl font-extrabold sm:text-5xl text-white">
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
  const { data: featured, isLoading: featuredLoading } = useVehicleSearch({ limit: 8, sortBy: "rating" });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (cityId) params.set("cityId", cityId);
    if (categoryId) params.set("categoryId", categoryId);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="overflow-hidden bg-background text-primary antialiased dark:bg-dark-background dark:text-white">
      {/* SECTION 1: SEARCH WIDGET & HERO BANNER SLIDER */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <RevealOnScroll>
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border/80 shadow-glass dark:border-white/10 lg:grid-cols-[400px_1fr]">
            {/* Search Box Widget — persistent, not part of the rotating slides */}
            <div className="bg-surface p-6 dark:bg-dark-surface sm:p-7">
              <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border/60 pb-4 dark:border-white/10">
                {[
                  { id: "all", label: "All Vehicles", icon: Car },
                  { id: "car", label: "Cars", icon: Car },
                  { id: "bike", label: "Bikes & Scooters", icon: Bike },
                  { id: "luxury", label: "Luxury Rides", icon: Sparkles },
                ].map((tab) => (
                  <span
                    key={tab.id}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-primary-600 dark:text-primary-300"
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </span>
                ))}
              </div>

              <Eyebrow>Best rental deals</Eyebrow>
              <h1 className="mt-2 font-heading text-2xl font-bold text-primary dark:text-white">
                Book Self-Drive Vehicles Across Chennai
              </h1>

              <div className="mt-6 flex flex-col gap-4">
                <Select
                  label="City"
                  placeholder="Choose city..."
                  options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                />
                <Select
                  label="Vehicle category"
                  placeholder="Choose category..."
                  options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                />
                <Button
                  onClick={handleSearch}
                  fullWidth
                  className="h-[46px] gap-2 font-heading shadow-card hover:-translate-y-0.5 active:translate-y-0 dark:bg-white dark:text-primary dark:hover:bg-primary-50"
                >
                  <Search size={18} />
                  <span>Search Available Rides</span>
                </Button>
              </div>
            </div>

            {/* Rotating promo banner — admin-managed via CMS → Hero banners */}
            <HeroSlider />
          </div>
        </RevealOnScroll>

        {/* Trust strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-primary-500 dark:text-primary-300 sm:justify-start sm:text-sm">
          <div className="flex items-center gap-2">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="font-extrabold text-primary dark:text-white">4.9/5</span>
            <span>Verified Renter Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-secondary" />
            <span className="font-extrabold text-primary dark:text-white">10,000+</span>
            <span>Kilometers Driven</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-secondary" />
            <span className="font-extrabold text-primary dark:text-white">Instant</span>
            <span>Key Pickups</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: POPULAR CATEGORIES GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <RevealOnScroll className="mb-10 text-center">
          <Eyebrow className="justify-center">Browse Fleet</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">
            Popular Categories
          </h2>
          <p className="mt-2 text-sm text-primary-400 max-w-md mx-auto">
            Find the perfect ride tailored for daily commutes, weekend getaways, or luxury tours.
          </p>
        </RevealOnScroll>

        {!categories?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, i) => {
              const colorStyle = getCategoryColorStyle(category.name);
              const icon = getCategoryIcon(category.name, category.iconUrl);
              return (
                <RevealOnScroll key={category.id} delay={i * 0.04}>
                  <Link to={`/search?categoryId=${category.id}`} className="group block">
                    <Card hoverable className="flex flex-col items-center gap-3.5 p-5 text-center shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:border-secondary/40 group-hover:shadow-card">
                      <div className={`flex size-14 items-center justify-center rounded-2xl ${colorStyle} transition-transform duration-300 group-hover:scale-110`}>
                        {icon}
                      </div>
                      <div>
                        <p className="font-heading text-sm font-bold text-primary group-hover:text-secondary dark:text-white dark:group-hover:text-accent-300">
                          {category.name}
                        </p>
                        <span className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-primary-400 group-hover:text-secondary">
                          Browse Fleet →
                        </span>
                      </div>
                    </Card>
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: FEATURED VEHICLES GRID */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Top Rated Rides</Eyebrow>
              <h2 className="mt-2 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">
                Featured Vehicles
              </h2>
              <p className="mt-1 text-sm text-primary-400">
                Verified condition, sanitized rides from our trusted local rental partners.
              </p>
            </div>
            <Link to="/search">
              <Button variant="outline" size="sm" className="hidden font-semibold sm:flex">
                Browse all vehicles <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !featured?.data.length ? (
            <EmptyState
              icon={<Search size={28} />}
              title="No featured vehicles available"
              description="Our partners are onboarding new vehicles daily — browse full search to check all listings."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.data.map((vehicle, i) => (
                <RevealOnScroll key={vehicle.id} delay={i * 0.05}>
                  <VehicleCard vehicle={vehicle} />
                </RevealOnScroll>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/search">
              <Button size="sm" variant="outline" className="w-full font-semibold">
                Browse all vehicles <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: POPULAR PARTNERS MARQUEE */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-8 text-center">
            <Eyebrow className="justify-center">Marketplace Partners</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">
              Popular Rental Hubs
            </h2>
            <p className="mt-2 text-sm text-primary-400">
              Verified local rental businesses serving customers across Chennai.
            </p>
          </RevealOnScroll>
        </div>

        <Marquee>
          {partnerChips.map((partner) => (
            <Card key={partner.name} className="mx-2 flex w-72 shrink-0 items-center gap-4 p-4 shadow-soft">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15">
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-semibold text-primary dark:text-white">{partner.name}</p>
                <p className="text-xs text-primary-400">{partner.city} Hub</p>
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> {partner.rating}
                </div>
              </div>
            </Card>
          ))}
        </Marquee>
      </section>

      {/* SECTION 4B: SPONSORED PARTNERS BANNER */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <SponsoredBanner />
        </RevealOnScroll>
      </section>

      {/* SECTION 4C: AD SLOTS */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <AdSlotsBand />
        </RevealOnScroll>
      </section>

      {/* SECTION 5: HOW IT WORKS STEP TIMELINE */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-12 text-center">
            <Eyebrow className="justify-center">Simple Process</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">
              How RentWheels Works
            </h2>
            <p className="mt-2 text-sm text-primary-400 max-w-md mx-auto">
              From instant search to smooth returns in five simple steps.
            </p>
          </RevealOnScroll>

          <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent lg:block" />

            {howItWorksSteps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <RevealOnScroll key={step.title} delay={i * 0.08} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-soft transition-transform duration-300 hover:scale-105 dark:bg-white dark:text-primary">
                    <Icon size={22} />
                  </div>
                  <p className="mt-4 font-heading text-sm font-bold text-primary dark:text-white">
                    0{i + 1}. {step.title}
                  </p>
                  <p className="mt-1.5 text-xs text-primary-400 leading-relaxed">{step.description}</p>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6: WHY CHOOSE US BENTO GRID */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll className="mb-10 text-center">
          <Eyebrow className="justify-center">Why RentWheels</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">
            Why Choose RentWheels
          </h2>
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
                {isFeature ? (
                  <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-primary p-7 text-white shadow-card dark:bg-dark-surface dark:border dark:border-white/10">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Icon size={26} />
                    </div>
                    <div className="mt-8">
                      <h3 className="font-heading text-xl font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-white/70 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ) : (
                  <Card className="h-full p-6 shadow-soft">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300">
                      <Icon size={20} />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-heading text-sm font-semibold text-primary dark:text-white">{item.title}</h3>
                      <p className="mt-1.5 text-xs text-primary-400 leading-relaxed">{item.description}</p>
                    </div>
                  </Card>
                )}
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: CUSTOMER TESTIMONIALS */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-10 text-center">
            <Eyebrow className="justify-center">Verified Reviews</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary dark:text-white sm:text-4xl">
              What Renters Say
            </h2>
          </RevealOnScroll>

          <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={t.name} delay={i * 0.08} className="w-[85%] shrink-0 snap-center sm:w-[60%] lg:w-auto">
                <Card className="flex h-full flex-col justify-between p-7 shadow-soft">
                  <div>
                    <StarRating value={t.rating} size={15} />
                    <p className="mt-4 text-base font-medium leading-relaxed text-primary-700 dark:text-primary-100">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4 dark:border-white/10">
                    <Avatar name={t.name} size={36} />
                    <div>
                      <p className="font-heading text-sm font-bold text-primary dark:text-white">{t.name}</p>
                      <p className="text-xs text-primary-400">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: STATS COUNTER BAND */}
      <section className="relative overflow-hidden bg-primary py-16 text-white shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat, i) => (
            <RevealOnScroll key={stat.label} delay={i * 0.08} className="text-center">
              <StatCounter value={stat.value} />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/70">{stat.label}</p>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* SECTION 9: DOWNLOAD MOBILE APP CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[28px] border border-border/70 bg-white p-8 shadow-card dark:bg-dark-surface dark:border-white/10 sm:p-12 lg:flex-row lg:text-left">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-primary dark:text-white sm:text-3xl">Take RentWheels with you</h2>
              <p className="mt-2 max-w-md text-sm text-primary-400 leading-relaxed">
                Get the app for faster bookings, live trip tracking, and exclusive mobile-only discounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              {/* App Store Badge */}
              <a
                href="#app-store"
                className="group flex items-center gap-3.5 rounded-full bg-[#0C1017] px-6 py-3 text-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:bg-[#161D2B] hover:shadow-lg active:scale-95 border border-white/10"
              >
                <AppleMark size={26} />
                <div className="text-left leading-none">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-300/90">
                    DOWNLOAD ON THE
                  </span>
                  <span className="mt-1 block font-sans text-[15px] font-bold tracking-tight text-white">
                    App Store
                  </span>
                </div>
              </a>

              {/* Google Play Badge */}
              <a
                href="#google-play"
                className="group flex items-center gap-3.5 rounded-full bg-[#0C1017] px-6 py-3 text-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:bg-[#161D2B] hover:shadow-lg active:scale-95 border border-white/10"
              >
                <GooglePlayMark size={24} />
                <div className="text-left leading-none">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-300/90">
                    GET IT ON
                  </span>
                  <span className="mt-1 block font-sans text-[15px] font-bold tracking-tight text-white">
                    Google Play
                  </span>
                </div>
              </a>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* SECTION 10: FAQ & NEWSLETTER */}
      <section className="bg-primary-50/50 py-16 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll className="mb-8 text-center">
            <Eyebrow className="justify-center">Questions</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-bold text-primary dark:text-white sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <FaqAccordion items={faqItems} />
          </RevealOnScroll>
        </div>
      </section>

      {/* NEWSLETTER BANNER */}
      <section className="relative overflow-hidden bg-primary py-16 text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <Mail size={22} className="text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold">Stay in the loop</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/75">
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
