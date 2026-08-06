import { buildMetadata } from "@/lib/seo";

// Behind auth / transactional: no indexable content, and crawl budget
// spent here is wasted.
export const metadata = buildMetadata({
  title: "Log In",
  description: "Sign in to your RentWheels account to manage bookings, licences, and payments.",
  path: "/login",
  noIndex: true,
});

import { Suspense } from "react";
import { PageSpinner } from "@vrm/ui";
import { RequireGuest } from "@/routes/guards";
import { LoginPage } from "@/screens/auth/LoginPage";

export default function Login() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    </Suspense>
  );
}
