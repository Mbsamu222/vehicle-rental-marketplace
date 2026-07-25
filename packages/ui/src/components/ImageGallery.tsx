"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "../utils/cn";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  if (!images.length) {
    return (
      <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-3xl border border-border/80 bg-primary-50/50 text-primary-300 dark:bg-white/5">
        <ImageOff size={36} />
      </div>
    );
  }

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  const scrollStrip = (dir: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth / 3 + 12), behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex h-72 sm:h-96 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-primary-50/30 via-surface to-primary-50/60 p-4 dark:from-white/5 dark:via-dark-surface dark:to-white/5">
        <img
          src={images[active]}
          alt={alt}
          className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-primary shadow-soft backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:border-white/10 dark:bg-dark-surface/95 dark:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-primary shadow-soft backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:border-white/10 dark:bg-dark-surface/95 dark:text-white"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-primary-900/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {active + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="relative">
          {images.length > 3 && (
            <button
              onClick={() => scrollStrip(-1)}
              aria-label="Scroll thumbnails left"
              className="absolute -left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-primary shadow-soft backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:border-white/10 dark:bg-dark-surface/95 dark:text-white"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          <div ref={stripRef} className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={cn(
                  "relative size-16 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all",
                  idx === active
                    ? "border-secondary shadow-soft dark:border-accent-300"
                    : "border-border/60 opacity-70 hover:opacity-100 dark:border-white/10",
                )}
              >
                <img src={img} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>

          {images.length > 3 && (
            <button
              onClick={() => scrollStrip(1)}
              aria-label="Scroll thumbnails right"
              className="absolute -right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-primary shadow-soft backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:border-white/10 dark:bg-dark-surface/95 dark:text-white"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
