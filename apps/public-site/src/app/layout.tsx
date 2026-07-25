import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { PublicLayout } from "@/layout/PublicLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentWheels — Rent vehicles from trusted local partners",
  description:
    "RentWheels connects you with verified local rental partners for cars, bikes, and more. Search, compare, and book vehicles in minutes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <PublicLayout>{children}</PublicLayout>
        </Providers>
      </body>
    </html>
  );
}
