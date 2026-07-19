"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMyPartnerProfile } from "@vrm/api-client";
import { PageSpinner } from "@vrm/ui";

/**
 * Guards routes that require a completed rental-partner profile. `useMyPartnerProfile`
 * 404s (retry: false) until `createProfile` has succeeded, so an error here just means
 * "hasn't finished onboarding yet" — send them there instead of into the dashboard shell.
 */
export function RequirePartnerProfile({ children }: { children: ReactNode }) {
  const { data: partner, isLoading, isError } = useMyPartnerProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (isError || !partner)) {
      router.replace("/onboarding");
    }
  }, [isLoading, isError, partner, router]);

  if (isLoading || isError || !partner) return <PageSpinner />;
  return <>{children}</>;
}
