"use client";

import type { ReactNode } from "react";
import { Eyebrow, GradientMesh, RevealOnScroll } from "@vrm/ui";

/** Shared dark hero header band used across all public site pages for brand consistency. */
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
      <div className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" aria-hidden="true" />

      <div className={`relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 ${size === "sm" ? "py-14 sm:py-16" : "py-20 lg:py-24"}`}>
        <RevealOnScroll>
          <Eyebrow tone="light" className="justify-center">
            {eyebrow}
          </Eyebrow>
          <h1 className={`mx-auto mt-4 font-heading font-black tracking-tight text-white ${size === "sm" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"}`}>
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {description}
            </p>
          )}
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}
