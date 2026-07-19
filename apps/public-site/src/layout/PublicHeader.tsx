"use client";

import { useEffect, useState } from "react";
import {
  Car,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  LayoutDashboard,
  CalendarCheck,
  Heart,
  Wallet,
  LifeBuoy,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useAuth, useNotifications } from "@vrm/api-client";
import { useTheme, Button, Dropdown, Avatar, cn, Link, NavLink, useNavigate } from "@vrm/ui";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Search" },
  { to: "/categories", label: "Categories" },
  { to: "/cities", label: "Cities" },
  { to: "/become-a-partner", label: "Become a Partner" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const accountLinks = [
  { to: "/account", label: "Dashboard", icon: LayoutDashboard },
  { to: "/account/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/payments", label: "Payments & Wallet", icon: Wallet },
  { to: "/account/support", label: "Support", icon: LifeBuoy },
  { to: "/account/profile", label: "Profile & Settings", icon: UserCircle },
];

export function PublicHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: notifications } = useNotifications(true, isAuthenticated);
  const unreadCount = notifications?.meta?.unreadCount as number | undefined;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300",
        scrolled
          ? "border-border bg-surface/90 shadow-soft dark:border-dark-border dark:bg-dark-surface/90"
          : "border-transparent bg-surface/50 dark:bg-dark-surface/40",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary dark:text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-white">
            <Car size={18} />
          </span>
          RentWheels
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary dark:text-primary-200 dark:hover:bg-white/5 dark:hover:text-white",
                  isActive && "bg-primary-50 text-primary dark:bg-white/10 dark:text-white",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-9 items-center justify-center rounded-lg text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && user ? (
            <>
              <Link
                to="/account/notifications"
                aria-label="Notifications"
                className="relative flex size-9 items-center justify-center rounded-lg text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5"
              >
                <Bell size={18} />
                {!!unreadCount && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-primary-50 dark:hover:bg-white/10">
                    <Avatar src={user.avatarUrl} name={`${user.firstName} ${user.lastName}`} size={32} />
                    <span className="hidden text-sm font-medium text-primary dark:text-white xl:block">{user.firstName}</span>
                  </button>
                }
                items={[
                  ...accountLinks.map((item) => ({
                    label: item.label,
                    icon: <item.icon size={15} />,
                    onClick: () => navigate(item.to),
                  })),
                  { label: "Log out", icon: <LogOut size={15} />, onClick: onLogout, danger: true },
                ]}
              />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="flex size-9 items-center justify-center rounded-lg text-primary-500 lg:hidden dark:text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border px-4 py-3 lg:hidden dark:border-dark-border">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-primary-500 dark:text-primary-200",
                    isActive && "bg-primary-50 text-primary dark:bg-white/10 dark:text-white",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated &&
              accountLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-500 dark:text-primary-200",
                      isActive && "bg-primary-50 text-primary dark:bg-white/10 dark:text-white",
                    )
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 dark:border-dark-border">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex size-9 items-center justify-center rounded-lg text-primary-400 hover:bg-primary-50 dark:hover:bg-white/5"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={15} /> Log out
              </Button>
            ) : (
              <>
                <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" size="sm" fullWidth>
                    Log in
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" size="sm" fullWidth>
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
