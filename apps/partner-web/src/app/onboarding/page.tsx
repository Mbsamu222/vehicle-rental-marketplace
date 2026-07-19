import { RequireAuth } from "@/routes/guards";
import { OnboardingPage } from "@/screens/onboarding/OnboardingPage";

export default function Onboarding() {
  return (
    <RequireAuth>
      <OnboardingPage />
    </RequireAuth>
  );
}
