import { Suspense } from "react";
import { PageSpinner } from "@vrm/ui";
import { VerifyOtpPage } from "@/screens/auth/VerifyOtpPage";

export default function VerifyOtp() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <VerifyOtpPage />
    </Suspense>
  );
}
