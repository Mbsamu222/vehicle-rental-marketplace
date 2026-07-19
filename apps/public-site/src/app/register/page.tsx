import { RequireGuest } from "@/routes/guards";
import { RegisterPage } from "@/screens/auth/RegisterPage";

export default function Register() {
  return (
    <RequireGuest>
      <RegisterPage />
    </RequireGuest>
  );
}
