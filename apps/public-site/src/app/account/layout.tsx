import type { ReactNode } from "react";
import { RequireAuth } from "@/routes/guards";
import { AccountLayout } from "@/layouts/AccountLayout";

export default function AccountRouteLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AccountLayout>{children}</AccountLayout>
    </RequireAuth>
  );
}
