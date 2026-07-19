import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../utils/cn";

export function StatCard({
  label,
  value,
  icon,
  trend,
  tone = "secondary",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  tone?: "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary-50 text-primary dark:bg-white/10 dark:text-white",
    secondary: "bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-secondary-300",
    accent: "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300",
    success: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    danger: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-primary-400">{label}</p>
          <p className="mt-1.5 font-heading text-2xl font-bold text-primary dark:text-white">{value}</p>
        </div>
        {icon && <div className={cn("flex size-11 items-center justify-center rounded-xl", toneClasses[tone])}>{icon}</div>}
      </div>
      {trend && (
        <div className={cn("mt-3 inline-flex items-center gap-1 text-xs font-medium", trend.value >= 0 ? "text-success" : "text-danger")}>
          {trend.value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend.value)}% {trend.label ?? "vs last period"}
        </div>
      )}
    </Card>
  );
}
