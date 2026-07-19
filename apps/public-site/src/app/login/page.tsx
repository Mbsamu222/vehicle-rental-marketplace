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
