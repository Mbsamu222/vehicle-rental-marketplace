import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Eyebrow({
  children,
  tone = "secondary",
  className,
}: {
  children: ReactNode;
  tone?: "secondary" | "accent" | "light";
  className?: string;
}) {
  const toneClasses = {
    secondary: "text-secondary",
    accent: "text-accent-500",
    light: "text-white/80",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]", toneClasses[tone], className)}>
      <span className={cn("h-px w-6", tone === "light" ? "bg-white/50" : "bg-current opacity-50")} />
      {children}
    </div>
  );
}
