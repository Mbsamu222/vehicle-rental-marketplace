"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHeroBanners } from "@vrm/api-client";

const AUTOPLAY_MS = 6000;

type SlideItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

const FALLBACK_SLIDE: SlideItem = {
  id: "fallback",
  title: "Rent Smarter. Drive Unlimited Possibilities.",
  subtitle: "Transparent daily rates, instant booking confirmation, zero hidden fees.",
};

/**
 * Right-hand promo panel of the homepage hero, driven by admin-managed
 * banner slides (CMS → Hero banners). Sits alongside the persistent search
 * widget rather than behind it — see HomePage's SECTION 1 for the split layout.
 */
export function HeroSlider() {
  const { data: slides } = useHeroBanners();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const items: SlideItem[] = slides?.length ? slides : [FALLBACK_SLIDE];

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  const slide = items[index] ?? items[0];
  const goTo = (i: number) => setIndex((i + items.length) % items.length);

  return (
    <div
      className="relative flex min-h-[380px] flex-col justify-end overflow-hidden bg-primary text-white dark:bg-dark-surface lg:min-h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image crossfade */}
      <AnimatePresence>
        {slide.imageUrl && (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-900/40 to-primary-900/10" />

      {/* Nav arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Slide copy */}
      <div className="relative z-[1] px-6 pb-16 pt-10 sm:px-10 sm:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h2 className="max-w-md font-heading text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 sm:text-base">{slide.subtitle}</p>
            )}
            {slide.ctaLabel && slide.ctaUrl && (
              <a
                href={slide.ctaUrl}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-heading text-sm font-bold text-primary shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-50"
              >
                {slide.ctaLabel}
                <ChevronRight size={16} />
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-5 right-6 z-10 flex items-center gap-1.5">
          {items.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
