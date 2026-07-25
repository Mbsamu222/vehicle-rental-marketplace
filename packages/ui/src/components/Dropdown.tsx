"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../utils/cn";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Menu is portaled to <body> and positioned with fixed coordinates, so it can
  // never be clipped by an ancestor's overflow (eg. the table's overflow-x-auto
  // wrapper cutting off the menu on rows near the bottom of the table).
  useEffect(() => {
    if (!open) return;

    const reposition = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const estimatedMenuHeight = items.length * 40 + 16;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < estimatedMenuHeight + 12 && rect.top > spaceBelow;

      setMenuStyle({
        position: "fixed",
        ...(openUpward ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
        ...(align === "right" ? { right: window.innerWidth - rect.right } : { left: rect.left }),
      });
    };

    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, align, items.length]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={triggerRef}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                style={menuStyle}
                className={cn(
                  "z-50 min-w-[180px] overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-card dark:border-dark-border dark:bg-dark-surface",
                )}
              >
                {items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-white/5",
                      item.danger ? "text-danger" : "text-primary dark:text-white",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
