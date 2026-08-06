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
    secondary: "bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300",
    accent: "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-300",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  };

  return (
    <Card hoverable className="flex flex-col justify-between p-5 shadow-soft border border-border/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-400">{label}</p>
          <p className="mt-2 font-heading text-2xl font-black tracking-tight text-primary dark:text-white sm:text-3xl">{value}</p>
        </div>
        {icon && <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-soft", toneClasses[tone])}>{icon}</div>}
      </div>
      {trend && (
        <div className={cn("mt-4 inline-flex items-center gap-1 text-xs font-bold", trend.value >= 0 ? "text-success" : "text-danger")}>
          {trend.value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend.value)}%</span>
          <span className="font-normal text-primary-400">{trend.label ?? "vs last period"}</span>
        </div>
      )}
    </Card>
  );
}
