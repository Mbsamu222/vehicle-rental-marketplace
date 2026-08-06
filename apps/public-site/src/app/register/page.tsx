import { buildMetadata } from "@/lib/seo";

// Behind auth / transactional: no indexable content, and crawl budget
// spent here is wasted.
export const metadata = buildMetadata({
  title: "Create an Account",
  description: "Create a free RentWheels customer account to book self-drive vehicles.",
  path: "/register",
  noIndex: true,
});

import { RequireGuest } from "@/routes/guards";
import { RegisterPage } from "@/screens/auth/RegisterPage";

export default function Register() {
  return (
    <RequireGuest>
      <RegisterPage />
    </RequireGuest>
  );
}
