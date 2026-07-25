"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Zap, LifeBuoy, Fuel, ArrowRight } from "lucide-react";
import { Link } from "@vrm/ui";
import { useAffiliatePartners } from "@vrm/api-client";
import type { AffiliateCategory } from "@vrm/api-client";

const iconMap: Record<AffiliateCategory, typeof ShieldCheck> = {
  INSURANCE: ShieldCheck,
  ROADSIDE_ASSISTANCE: LifeBuoy,
  FUEL: Fuel,
  OTHER: Zap,
};

const ROTATE_MS = 6000;

export function SponsoredBanner() {
  const { data: sponsoredPartners } = useAffiliatePartners();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || !sponsoredPartners?.length) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % sponsoredPartners.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, sponsoredPartners?.length]);

  // No backend rows, or the affiliate program toggle is off — the API already
  // returns [] in that case, so there is nothing to render here.
  if (!sponsoredPartners?.length) return null;

  const sponsor = sponsoredPartners[index % sponsoredPartners.length];
  const Icon = iconMap[sponsor.category];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-soft dark:border-white/10 dark:bg-dark-surface sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`icon-${index}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25 }}
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300"
            >
              <Icon size={22} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${index}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-500 dark:bg-white/10 dark:text-primary-300">
                  Sponsored
                </span>
                <p className="truncate font-heading text-sm font-bold text-primary dark:text-white">{sponsor.name}</p>
              </div>
              <p className="mt-1 truncate text-xs text-primary-400 sm:whitespace-normal">{sponsor.tagline}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
          <a
            href={sponsor.referralUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline dark:text-accent-300"
          >
            {sponsor.ctaLabel ?? "Learn more"} <ArrowRight size={14} />
          </a>

          <div className="flex items-center gap-1.5">
            {sponsoredPartners.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Show sponsor ${s.name}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-secondary dark:bg-accent-300" : "w-1.5 bg-primary-100 dark:bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3 text-right dark:border-white/10">
        <Link to="/contact" className="text-xs font-semibold text-primary-400 hover:text-secondary dark:hover:text-accent-300">
          Want to advertise here? Get in touch →
        </Link>
      </div>
    </div>
  );
}
