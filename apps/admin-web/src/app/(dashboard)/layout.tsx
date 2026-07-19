import type { ReactNode } from "react";
import { RequireAuth } from "@/routes/guards";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}
