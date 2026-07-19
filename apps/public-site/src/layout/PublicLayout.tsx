"use client";

import type { ReactNode } from "react";
import { PageTransition } from "@vrm/ui";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <PublicFooter />
    </div>
  );
}
