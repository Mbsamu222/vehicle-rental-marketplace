import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
  children: ReactNode;
}

export function Card({ className, glass, hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft dark:bg-dark-surface dark:border-dark-border",
        glass && "backdrop-blur-md bg-white/70 dark:bg-white/5 shadow-glass dark:shadow-glass-dark border-white/40 dark:border-white/10",
        hoverable && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border px-5 py-4 dark:border-dark-border", className)} {...props}>
      {children}
    </div>
  );
}
