"use client";

import { ArrowRight } from "lucide-react";
import { Card } from "@vrm/ui";
import { useAdSlots } from "@vrm/api-client";

export function AdSlotsBand() {
  const { data: adSlots } = useAdSlots();

  // Empty whenever Sponsored placements is off or no slots are configured —
  // the API already gates this server-side, so an empty list means "render nothing."
  if (!adSlots?.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {adSlots.map((slot) => (
        <a key={slot.id} href={slot.ctaUrl ?? "#"} target="_blank" rel="noopener noreferrer sponsored">
          <Card hoverable className="flex items-center gap-3 overflow-hidden p-3 shadow-soft">
            <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-white/5">
              <img src={slot.imageUrl} alt={slot.title} className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-500 dark:bg-white/10 dark:text-primary-300">
                  Sponsored
                </span>
              </div>
              <p className="truncate font-heading text-sm font-bold text-primary dark:text-white">{slot.title}</p>
              {slot.subtitle && <p className="truncate text-xs text-primary-400">{slot.subtitle}</p>}
            </div>
            {slot.ctaLabel && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-secondary dark:text-accent-300">
                {slot.ctaLabel} <ArrowRight size={13} />
              </span>
            )}
          </Card>
        </a>
      ))}
    </div>
  );
}
