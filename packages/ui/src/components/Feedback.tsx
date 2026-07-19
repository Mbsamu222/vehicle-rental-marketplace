import type { HTMLAttributes, ReactNode } from "react";
import { Loader2, Inbox } from "lucide-react";
import { cn } from "../utils/cn";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-secondary", className)} size={size} />;
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-primary-100 dark:bg-white/10",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent dark:before:via-white/10",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border p-4 dark:border-dark-border">
      <Skeleton className="mb-3 h-40 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center dark:border-dark-border", className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-50 text-primary-300 dark:bg-white/5">
        {icon ?? <Inbox size={26} />}
      </div>
      <div>
        <p className="font-heading text-base font-semibold text-primary dark:text-white">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-primary-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("border-border dark:border-dark-border", className)} {...props} />;
}
