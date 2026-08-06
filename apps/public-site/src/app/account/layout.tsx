import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AccountLayout } from "@/layouts/AccountLayout";
import { RequireAuth } from "@/routes/guards";

// Applies to every /account/* route. These pages sit behind auth and contain
// personal data, so they must never be indexed. robots.ts disallows the path as
// a second layer of defence.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountRouteLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AccountLayout>{children}</AccountLayout>
    </RequireAuth>
  );
}
