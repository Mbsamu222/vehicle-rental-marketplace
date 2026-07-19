import type { ReactNode } from "react";
import { RequireAuth } from "@/routes/guards";
import { RequirePartnerProfile } from "@/routes/ProfileGate";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequirePartnerProfile>
        <DashboardLayout>{children}</DashboardLayout>
      </RequirePartnerProfile>
    </RequireAuth>
  );
}
