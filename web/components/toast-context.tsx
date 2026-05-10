"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const STYLES: Record<
  ToastType,
  { bg: string; border: string; color: string; icon: React.ReactNode }
> = {
  success: {
    bg: "#ECFDF5",
    border: "#BBF7D0",
    color: "#065F46",
    icon: <CheckCircle2 size={16} className="shrink-0" />,
  },
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#B91C1C",
    icon: <AlertCircle size={16} className="shrink-0" />,
  },
  info: {
    bg: "var(--color-surface)",
    border: "var(--color-border)",
    color: "var(--color-text)",
    icon: <Info size={16} className="shrink-0" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const success = useCallback((m: string) => toast("success", m), [toast]);
  const error = useCallback((m: string) => toast("error", m), [toast]);
  const info = useCallback((m: string) => toast("info", m), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}

      {/* Fixed toast stack — bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lg text-sm font-medium min-w-[220px] max-w-xs toast-enter"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color,
              }}
              role="alert"
            >
              {s.icon}
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-50 transition hover:opacity-100"
                aria-label="閉じる"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
