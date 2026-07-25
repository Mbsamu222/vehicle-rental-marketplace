"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Star,
  LifeBuoy,
  Building2,
  Wallet,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { useAuth, useMonetizationStatus } from "@vrm/api-client";
import { DashboardShell, type NavItem, useNavigate } from "@vrm/ui";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: status } = useMonetizationStatus();

  if (!user) return null;

  // Payouts/Subscription/Fleet analytics only appear once the admin has
  // actually turned the corresponding revenue feature on — a partner shouldn't
  // see a tab that leads to a page with nothing meaningful in it.
  const navItems: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
    { to: "/vehicles", label: "My vehicles", icon: <Car size={18} /> },
    { to: "/bookings", label: "Bookings", icon: <CalendarCheck size={18} /> },
    ...(status?.BOOKING_COMMISSION ? [{ to: "/payouts", label: "Payouts", icon: <Wallet size={18} /> }] : []),
    ...(status?.PARTNER_SUBSCRIPTIONS
      ? [{ to: "/subscription", label: "Subscription", icon: <Sparkles size={18} /> }]
      : []),
    ...(status?.FLEET_ANALYTICS ? [{ to: "/analytics", label: "Fleet analytics", icon: <BarChart3 size={18} /> }] : []),
    { to: "/reviews", label: "Reviews", icon: <Star size={18} /> },
    { to: "/support", label: "Support", icon: <LifeBuoy size={18} /> },
    { to: "/business-profile", label: "Business profile", icon: <Building2 size={18} /> },
  ];

  return (
    <DashboardShell
      logo={
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-primary dark:text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-white">
            <Car size={18} />
          </span>
          RentWheels Partner
        </div>
      }
      navItems={navItems}
      userName={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.email}
      avatarUrl={user.avatarUrl}
      onNotificationsClick={() => navigate("/notifications")}
      onSettingsClick={() => navigate("/business-profile")}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
