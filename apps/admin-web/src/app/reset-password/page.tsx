import { Suspense } from "react";
import { PageSpinner } from "@vrm/ui";
import { RequireGuest } from "@/routes/guards";
import { ResetPasswordPage } from "@/screens/auth/ResetPasswordPage";

export default function ResetPassword() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <RequireGuest>
        <ResetPasswordPage />
      </RequireGuest>
    </Suspense>
  );
}
