import { buildMetadata } from "@/lib/seo";

// Behind auth / transactional: no indexable content, and crawl budget
// spent here is wasted.
export const metadata = buildMetadata({
  title: "Forgot Password",
  description: "Reset the password for your RentWheels account.",
  path: "/forgot-password",
  noIndex: true,
});

import { RequireGuest } from "@/routes/guards";
import { ForgotPasswordPage } from "@/screens/auth/ForgotPasswordPage";

export default function ForgotPassword() {
  return (
    <RequireGuest>
      <ForgotPasswordPage />
    </RequireGuest>
  );
}
