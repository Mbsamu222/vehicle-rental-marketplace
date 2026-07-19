import { RequireGuest } from "@/routes/guards";
import { ForgotPasswordPage } from "@/screens/auth/ForgotPasswordPage";

export default function ForgotPassword() {
  return (
    <RequireGuest>
      <ForgotPasswordPage />
    </RequireGuest>
  );
}
