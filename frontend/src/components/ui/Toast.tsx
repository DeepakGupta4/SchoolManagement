"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: { title: string; description?: string; variant?: ToastVariant }) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const variantConfig: Record<ToastVariant, { Icon: typeof Info; accent: string; iconColor: string }> = {
  success: { Icon: CheckCircle2, accent: "border-l-success", iconColor: "text-success" },
  error: { Icon: XCircle, accent: "border-l-danger", iconColor: "text-danger" },
  warning: { Icon: AlertTriangle, accent: "border-l-warning", iconColor: "text-warning" },
  info: { Icon: Info, accent: "border-l-info", iconColor: "text-info" },
};

const DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ title, description, variant = "success" }) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION)
      );
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2"
      >
        {toasts.map(({ id, title, description, variant }) => {
          const { Icon, accent, iconColor } = variantConfig[variant];
          return (
            <div
              key={id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 border-border bg-surface-raised p-3.5 shadow-lg",
                accent
              )}
              style={{ animation: "toast-in var(--duration-base) var(--ease-out)" }}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{title}</p>
                {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
              </div>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss notification"
                className="focus-ring shrink-0 rounded-sm p-0.5 text-subtle transition-colors hover:text-text"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
