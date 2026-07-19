"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, CalendarCheck, Heart, Wallet, LifeBuoy, UserCircle } from "lucide-react";
import { cn, NavLink } from "@vrm/ui";

const navItems = [
  { to: "/account", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/account/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/payments", label: "Payments & Wallet", icon: Wallet },
  { to: "/account/support", label: "Support", icon: LifeBuoy },
  { to: "/account/profile", label: "Profile & Settings", icon: UserCircle },
];

/**
 * Slim account-section sidebar (Flipkart's "My Account" pattern) rendered
 * inside the same site-wide PublicLayout header/footer — not a separate app
 * shell like partner-web/admin-web's DashboardShell.
 */
export function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="shrink-0 lg:w-60">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-white shadow-soft"
                      : "text-primary-500 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-white/5",
                  )
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
