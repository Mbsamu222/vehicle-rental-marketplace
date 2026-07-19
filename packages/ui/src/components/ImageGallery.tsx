"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "../utils/cn";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-primary-50 text-primary-300 dark:bg-white/5">
        <ImageOff size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-primary-50 dark:bg-white/5">
        <img src={images[active]} alt={alt} className="size-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-soft"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % images.length)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-soft"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                idx === active ? "border-secondary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img src={img} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
