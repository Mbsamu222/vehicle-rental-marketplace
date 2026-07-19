"use client";

import { Car, Globe, Camera, Hash, Share2 } from "lucide-react";
import { Link } from "@vrm/ui";

const PARTNER_WEB_URL = "http://localhost:5174";

const columns: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-conditions" },
      { label: "Refund Policy", to: "/refund-policy" },
    ],
  },
  {
    title: "For Partners",
    links: [{ label: "Become a Partner", to: "/become-a-partner" }],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Support", to: "/support" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface dark:border-dark-border dark:bg-dark-surface">
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary dark:text-white">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-white">
                <Car size={18} />
              </span>
              RentWheels
            </Link>
            <p className="mt-3 max-w-xs text-sm text-primary-400">
              Rent vehicles from trusted local partners — cars, bikes, and more, in cities near you.
            </p>
            {/* lucide-react ^1.25.0 ships no brand/logo icons, so generic
                icons stand in as social-link placeholders. */}
            <div className="mt-4 flex items-center gap-3 text-primary-400">
              <a href="#" aria-label="Facebook" className="hover:text-secondary">
                <Globe size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-secondary">
                <Camera size={18} />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-secondary">
                <Hash size={18} />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-secondary">
                <Share2 size={18} />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-heading text-sm font-semibold text-primary dark:text-white">{col.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-primary-400 hover:text-secondary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-primary-400 sm:flex-row dark:border-dark-border">
          <p>© {new Date().getFullYear()} RentWheels. All rights reserved.</p>
          <p>
            Are you a rental business?{" "}
            <a href={`${PARTNER_WEB_URL}/register`} className="font-semibold text-secondary hover:underline">
              Partner with us
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
