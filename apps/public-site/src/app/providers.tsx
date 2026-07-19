"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@vrm/api-client";
import { ThemeProvider, ToastProvider } from "@vrm/ui";
import { queryClient } from "@/lib/queryClient";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider allowedUserTypes={["CUSTOMER"]}>{children}</AuthProvider>
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
