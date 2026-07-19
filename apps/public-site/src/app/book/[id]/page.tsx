import { Suspense } from "react";
import { PageSpinner } from "@vrm/ui";
import { RequireAuth } from "@/routes/guards";
import { BookingCheckoutPage } from "@/screens/booking/BookingCheckoutPage";

export default function Book() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <RequireAuth>
        <BookingCheckoutPage />
      </RequireAuth>
    </Suspense>
  );
}
