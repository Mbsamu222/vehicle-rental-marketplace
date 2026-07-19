import { cn } from "../utils/cn";

/**
 * Decorative blurred gradient blobs for hero/CTA sections. Render inside a
 * `relative` parent; this fills it absolutely and sits behind content.
 * Pure CSS — no image assets required.
 */
export function GradientMesh({ variant = "dark", className }: { variant?: "dark" | "light"; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div
        className={cn(
          "absolute -left-24 -top-32 size-[28rem] animate-blob rounded-full blur-3xl",
          variant === "dark" ? "bg-secondary/40" : "bg-secondary/15",
        )}
      />
      <div
        className={cn(
          "absolute -right-24 top-1/3 size-[24rem] animate-blob rounded-full blur-3xl [animation-delay:-6s]",
          variant === "dark" ? "bg-accent/30" : "bg-accent/15",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[-8rem] left-1/3 size-[22rem] animate-blob rounded-full blur-3xl [animation-delay:-11s]",
          variant === "dark" ? "bg-secondary/20" : "bg-secondary/10",
        )}
      />
      <div className={cn("absolute inset-0 bg-noise", variant === "dark" ? "opacity-100" : "opacity-60")} />
    </div>
  );
}
