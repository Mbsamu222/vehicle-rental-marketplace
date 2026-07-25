"use client";

import {
  Car,
  Globe,
  Camera,
  Hash,
  Share2,
  ShieldCheck,
  Headset,
  Sparkles,
  Zap,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { Link } from "@vrm/ui";

const PARTNER_WEB_URL = "http://localhost:5174";

const valueProps = [
  { icon: ShieldCheck, title: "100% Verified Partners", desc: "Every partner is background checked" },
  { icon: Headset, title: "24/7 Support & Roadside", desc: "Always here whenever you need us" },
  { icon: Zap, title: "Instant Booking", desc: "Real-time confirmation in seconds" },
  { icon: Sparkles, title: "Zero Hidden Fees", desc: "Transparent upfront daily rates" },
];

const columns: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Contact Us", to: "/contact" },
      { label: "Blog & News", to: "/blog" },
    ],
  },
  {
    title: "Legal & Safety",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-conditions" },
      { label: "Refund Policy", to: "/refund-policy" },
    ],
  },
  {
    title: "For Partners",
    links: [
      { label: "Become a Partner", to: "/become-a-partner" },
      { label: "Partner Portal", to: `${PARTNER_WEB_URL}/register`, external: true },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & FAQ", to: "/faq" },
      { label: "Customer Support", to: "/support" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-300">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" aria-hidden="true" />

      {/* Top Value Propositions Strip */}
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {valueProps.map((prop) => (
              <div key={prop.title} className="flex items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-300">
                  <prop.icon size={20} />
                </div>
                <div>
                  <p className="font-heading text-xs font-bold text-white">{prop.title}</p>
                  <p className="text-[11px] text-primary-300">{prop.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links & Branding */}
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand Info Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="group inline-flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-secondary to-accent text-white shadow-soft transition-transform duration-300 group-hover:scale-105">
                <Car size={20} />
              </div>
              <span className="font-heading text-xl font-extrabold tracking-tight text-white">
                Rent<span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Wheels</span>
              </span>
            </Link>
            <p className="mt-3.5 max-w-xs text-xs leading-relaxed text-primary-300">
              The premier peer-to-partner vehicle rental marketplace. Book cars, bikes, and luxury vehicles from verified local partners.
            </p>

            {/* Social Links */}
            <div className="mt-5 flex items-center gap-2.5 text-primary-300">
              {[
                { label: "Website", icon: Globe },
                { label: "Instagram", icon: Camera },
                { label: "Twitter", icon: Hash },
                { label: "Share", icon: Share2 },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary-300 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:text-white"
                >
                  <s.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-heading text-xs font-bold tracking-wider uppercase text-white">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-1 text-xs text-primary-300 transition-colors hover:text-accent-300"
                      >
                        {link.label}
                        <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1 text-xs text-primary-300 transition-colors hover:text-accent-300"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar & Trust Badges */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-primary-300 sm:flex-row">
          <p>© {new Date().getFullYear()} RentWheels Technologies Inc. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Lock size={13} className="text-success" /> 256-Bit SSL Encrypted
            </span>
            <span className="text-white/20">•</span>
            <p>
              Are you a rental business?{" "}
              <a href={`${PARTNER_WEB_URL}/register`} className="font-bold text-accent-300 hover:underline">
                Partner with us →
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
