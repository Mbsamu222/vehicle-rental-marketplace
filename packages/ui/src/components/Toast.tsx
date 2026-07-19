"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "../utils/cn";

type ToastTone = "success" | "error" | "info";
interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (title: string, opts?: { description?: string; tone?: ToastTone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneConfig: Record<ToastTone, { icon: ReactNode; classes: string }> = {
  success: { icon: <CheckCircle2 size={18} />, classes: "border-success/30 text-success" },
  error: { icon: <XCircle size={18} />, classes: "border-danger/30 text-danger" },
  info: { icon: <Info size={18} />, classes: "border-secondary/30 text-secondary" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // `document`/createPortal only exist client-side — this component still
  // gets an initial server render pass in Next.js despite being a Client
  // Component, so the portal target must wait until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const remove = useCallback((id: string) => setToasts((t) => t.filter((m) => m.id !== id)), []);

  const show = useCallback<ToastContextValue["show"]>((title, opts) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, description: opts?.description, tone: opts?.tone ?? "info" }]);
    setTimeout(() => remove(id), 4500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show(title, { description, tone: "success" }),
      error: (title, description) => show(title, { description, tone: "error" }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-surface px-4 py-3.5 shadow-card dark:bg-dark-surface",
                  toneConfig[t.tone].classes,
                )}
              >
                <span className="mt-0.5">{toneConfig[t.tone].icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary dark:text-white">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-primary-400">{t.description}</p>}
                </div>
                <button onClick={() => remove(t.id)} className="text-primary-300 hover:text-primary-500">
                  <X size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
