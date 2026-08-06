import { buildMetadata } from "@/lib/seo";

// Behind auth / transactional: no indexable content, and crawl budget
// spent here is wasted.
export const metadata = buildMetadata({
  title: "Reset Password",
  description: "Choose a new password for your RentWheels account.",
  path: "/reset-password",
  noIndex: true,
});

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
