"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AuthLayout({
  title,
  subtitle,
  brandTitle,
  brandTagline,
  children,
}: {
  title: string;
  subtitle?: string;
  brandTitle: ReactNode;
  brandTagline: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background dark:bg-dark-background">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-white lg:flex">
        <div>{brandTitle}</div>
        <div>
          <p className="font-heading text-3xl font-bold leading-tight">{brandTagline}</p>
          <p className="mt-3 max-w-md text-primary-200">
            Discover, compare, and book vehicles from trusted local rental partners across every city you travel to.
          </p>
        </div>
        <p className="text-sm text-primary-300">© {new Date().getFullYear()} Vehicle Rental Marketplace</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">{brandTitle}</div>
          <h1 className="font-heading text-2xl font-bold text-primary dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-primary-400">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
