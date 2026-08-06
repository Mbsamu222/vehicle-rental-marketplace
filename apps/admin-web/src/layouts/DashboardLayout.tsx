"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CarFront,
  IdCard,
  Wallet,
  Ticket,
  MapPinned,
  ShieldCheck,
  LifeBuoy,
  Globe,
  Newspaper,
  ScrollText,
  Settings as SettingsIcon,
  ShieldHalf,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@vrm/api-client";
import { DashboardShell, type NavItem, useNavigate } from "@vrm/ui";

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
  { to: "/users", label: "Customers", icon: <Users size={18} /> },
  { to: "/partners", label: "Rental Partners", icon: <Building2 size={18} /> },
  { to: "/vehicles/approvals", label: "Vehicle Approvals", icon: <CarFront size={18} /> },
  { to: "/drivers", label: "Drivers", icon: <IdCard size={18} /> },
  { to: "/driving-licenses", label: "Driving Licenses", icon: <IdCard size={18} /> },
  { to: "/transactions", label: "Transactions", icon: <Wallet size={18} /> },
  { to: "/coupons", label: "Coupons", icon: <Ticket size={18} /> },
  { to: "/monetization", label: "Monetization", icon: <DollarSign size={18} /> },
  { to: "/catalog", label: "Catalog", icon: <MapPinned size={18} /> },
  { to: "/roles", label: "Roles & Permissions", icon: <ShieldCheck size={18} /> },
  { to: "/support", label: "Support Tickets", icon: <LifeBuoy size={18} /> },
  { to: "/cms", label: "CMS & Blog", icon: <Newspaper size={18} /> },
  { to: "/seo", label: "SEO", icon: <Globe size={18} /> },
  { to: "/audit-logs", label: "Audit Logs", icon: <ScrollText size={18} /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon size={18} /> },
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
            <ShieldHalf size={18} />
          </span>
          RentWheels Admin
        </div>
      }
      navItems={navItems}
      userName={`${user.firstName} ${user.lastName}`}
      userSubtitle={user.email}
      avatarUrl={user.avatarUrl}
      onNotificationsClick={() => navigate("/dashboard")}
      onSettingsClick={() => navigate("/settings")}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
    >
      {children}
    </DashboardShell>
  );
}
