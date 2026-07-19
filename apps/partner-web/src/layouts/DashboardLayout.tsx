"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Star,
  LifeBuoy,
  Building2,
} from "lucide-react";
import { useAuth } from "@vrm/api-client";
import { DashboardShell, type NavItem, useNavigate } from "@vrm/ui";

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
  { to: "/vehicles", label: "My vehicles", icon: <Car size={18} /> },
  { to: "/bookings", label: "Bookings", icon: <CalendarCheck size={18} /> },
  { to: "/reviews", label: "Reviews", icon: <Star size={18} /> },
  { to: "/support", label: "Support", icon: <LifeBuoy size={18} /> },
  { to: "/business-profile", label: "Business profile", icon: <Building2 size={18} /> },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

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
