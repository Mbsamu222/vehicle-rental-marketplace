"use client";

import type { ReactNode } from "react";
import { Eyebrow, GradientMesh, RevealOnScroll } from "@vrm/ui";

/** Shared dark hero band used across every secondary marketing page for a consistent rhythm with Home. */
export function PageHero({
  eyebrow,
  title,
  description,
  size = "md",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  size?: "sm" | "md";
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-primary text-white dark:bg-dark-surface">
      <GradientMesh variant="dark" />
      <div className={`relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8 ${size === "sm" ? "py-16" : "py-20 lg:py-24"}`}>
        <RevealOnScroll>
          <Eyebrow tone="light" className="justify-center">
            {eyebrow}
          </Eyebrow>
          <h1 className={`mx-auto mt-5 font-heading font-extrabold tracking-tight ${size === "sm" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>
            {title}
          </h1>
          {description && <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">{description}</p>}
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}
