"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className={cn(
              "absolute z-40 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-card dark:border-dark-border dark:bg-dark-surface",
              align === "right" ? "right-0" : "left-0",
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
      </AnimatePresence>
    </div>
  );
}
