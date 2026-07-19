import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";
import type { BookingStatus } from "@vrm/api-client";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-primary-100 text-primary-700 dark:bg-white/10 dark:text-primary-100",
  success: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  accent: "bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

const bookingStatusTone: Record<BookingStatus, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  APPROVED: "info",
  REJECTED: "danger",
  VEHICLE_READY: "info",
  PICKED_UP: "accent",
  ACTIVE: "accent",
  RETURNING: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <Badge tone={bookingStatusTone[status]} className={className}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
