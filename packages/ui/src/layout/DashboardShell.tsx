"use client";

import { useState, type ReactNode } from "react";
import { Menu, X, Bell, Moon, Sun, LogOut, Settings, ChevronDown } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";
import { Avatar } from "../components/Avatar";
import { Dropdown } from "../components/Dropdown";
import { NavLink } from "../next/routing";
import { cn } from "../utils/cn";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export function DashboardShell({
  logo,
  navItems,
  userName,
  userSubtitle,
  avatarUrl,
  notificationCount = 0,
  onNotificationsClick,
  onSettingsClick,
  onLogout,
  children,
}: {
  logo: ReactNode;
  navItems: NavItem[];
  userName: string;
  userSubtitle?: string;
  avatarUrl?: string | null;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-white shadow-soft"
                : "text-primary-500 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-white/5",
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background dark:bg-dark-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface py-6 dark:border-dark-border dark:bg-dark-surface lg:flex">
        <div className="mb-8 px-5">{logo}</div>
        {nav}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex w-64 flex-col gap-6 bg-surface py-6 dark:bg-dark-surface">
            <div className="flex items-center justify-between px-5">
              {logo}
              <button onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/80 sm:px-6">
          <button className="text-primary-500 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="flex size-9 items-center justify-center rounded-full text-primary-500 hover:bg-primary-50 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={onNotificationsClick}
              className="relative flex size-9 items-center justify-center rounded-full text-primary-500 hover:bg-primary-50 dark:hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-primary-50 dark:hover:bg-white/10">
                  <Avatar src={avatarUrl} name={userName} size={32} />
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium text-primary dark:text-white">{userName}</span>
                    {userSubtitle && <span className="block text-xs text-primary-400">{userSubtitle}</span>}
                  </span>
                  <ChevronDown size={14} className="hidden text-primary-400 sm:block" />
                </button>
              }
              items={[
                ...(onSettingsClick ? [{ label: "Settings", icon: <Settings size={15} />, onClick: onSettingsClick }] : []),
                { label: "Log out", icon: <LogOut size={15} />, onClick: onLogout, danger: true },
              ]}
            />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
