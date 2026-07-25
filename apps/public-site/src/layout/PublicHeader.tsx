"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth, useNotifications } from "@vrm/api-client";
import { useTheme, Button, Dropdown, Avatar, cn, Link, NavLink, useNavigate } from "@vrm/ui";

const navLinks = [
  { to: "/", label: "Home" },
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
  const pathname = usePathname();
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
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-primary-100/80 bg-surface/85 backdrop-blur-xl shadow-soft dark:border-white/10 dark:bg-dark-surface/85"
          : "border-transparent bg-surface/60 backdrop-blur-md dark:bg-dark-surface/50",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-secondary to-accent text-white shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Car size={22} className="transition-transform duration-300 group-hover:-rotate-6" />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent-400" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-extrabold tracking-tight text-primary dark:text-white">
              Rent<span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Wheels</span>
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-primary-400 sm:block dark:text-primary-300">
              Verified Rentals
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const isActive = link.to === "/" ? pathname === "/" : pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={cn(
                  "group relative py-2 text-sm font-semibold tracking-wide transition-colors duration-200",
                  isActive
                    ? "text-secondary dark:text-white"
                    : "text-primary-600 hover:text-primary dark:text-primary-300 dark:hover:text-white",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-[2px] rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-300 ease-out",
                    isActive ? "w-full" : "w-0 group-hover:w-full",
                  )}
                />
              </NavLink>
            );
          })}
        </nav>

        {/* Right CTA / Controls */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/become-a-partner">
            <Button variant="outline" size="sm" className="rounded-full text-xs font-bold">
              Become a Partner
            </Button>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex size-10 items-center justify-center rounded-full border border-border/80 bg-surface/80 text-primary-500 shadow-soft transition-all duration-200 hover:scale-105 hover:bg-primary-50 dark:border-white/10 dark:bg-white/5 dark:text-primary-200 dark:hover:bg-white/10"
          >
            {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-secondary" />}
          </button>

          {isAuthenticated && user ? (
            <>
              <Link
                to="/account/notifications"
                aria-label="Notifications"
                className="relative flex size-10 items-center justify-center rounded-full border border-border/80 bg-surface/80 text-primary-500 shadow-soft transition-all duration-200 hover:scale-105 hover:bg-primary-50 dark:border-white/10 dark:bg-white/5 dark:text-primary-200 dark:hover:bg-white/10"
              >
                <Bell size={18} />
                {!!unreadCount && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white shadow-soft">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2.5 rounded-full border border-border/80 bg-surface/90 py-1 pl-1 pr-3.5 shadow-soft transition-all duration-200 hover:border-secondary/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20">
                    <Avatar src={user.avatarUrl} name={`${user.firstName} ${user.lastName}`} size={32} />
                    <div className="hidden text-left xl:block">
                      <span className="block text-xs font-bold text-primary dark:text-white">{user.firstName}</span>
                      <span className="block text-[10px] text-primary-400">Account</span>
                    </div>
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
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-xs font-semibold">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="sm" className="glow-pill rounded-full text-xs font-bold shadow-soft">
                  <Sparkles size={14} className="mr-1.5" /> Sign up free
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-primary-600 shadow-soft transition-colors lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {menuOpen && (
        <div className="border-t border-border bg-surface/95 px-5 py-6 backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-dark-surface/95">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-400">Navigation</span>
            <div className="flex items-center gap-1.5 text-xs text-secondary font-semibold">
              <ShieldCheck size={14} /> Verified Partner Network
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium text-primary-600 transition-all dark:text-primary-200",
                    isActive
                      ? "bg-secondary-50 text-secondary font-bold dark:bg-white/10 dark:text-white"
                      : "hover:bg-primary-50 dark:hover:bg-white/5",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/become-a-partner" onClick={() => setMenuOpen(false)} className="mt-3 block">
            <Button variant="outline" size="sm" className="w-full rounded-full text-xs font-bold">
              Become a Partner
            </Button>
          </Link>

          {isAuthenticated && (
            <div className="mt-6 border-t border-border pt-4 dark:border-white/10">
              <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-primary-400">My Account</span>
              <div className="grid grid-cols-2 gap-2">
                {accountLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-primary-600 dark:text-primary-200",
                        isActive ? "bg-secondary-50 text-secondary font-bold dark:bg-white/10 dark:text-white" : "hover:bg-primary-50 dark:hover:bg-white/5",
                      )
                    }
                  >
                    <item.icon size={15} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 dark:border-white/10">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-primary-600 dark:border-white/10 dark:text-primary-200"
            >
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-secondary" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs font-semibold"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={15} /> Log out
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs font-semibold">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="rounded-full text-xs font-bold">
                    Sign up <ArrowRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
