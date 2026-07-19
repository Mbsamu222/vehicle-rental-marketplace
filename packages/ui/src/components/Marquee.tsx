import type { ReactNode } from "react";
import { cn } from "../utils/cn";

/**
 * Slow auto-scrolling horizontal strip for trust/logo bands. Duplicates its
 * children once to create a seamless loop; pauses on hover.
 */
export function Marquee({ children, className, durationSeconds = 28 }: { children: ReactNode; className?: string; durationSeconds?: number }) {
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent dark:from-dark-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent dark:from-dark-background" />
      <div
        className="flex w-max animate-marquee gap-5 group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        <div className="flex shrink-0 gap-5">{children}</div>
        <div className="flex shrink-0 gap-5" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
