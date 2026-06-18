"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  icon?: ReactNode;
  createdAt: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (input: Omit<Toast, "id" | "createdAt"> & { id?: string }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (message: string, opts?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>) => string;
  error: (message: string, opts?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>) => string;
  info: (message: string, opts?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToasts(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within a ToastProvider");
  return ctx;
}

const toastVariants = {
  initial: { opacity: 0, y: 12, scale: 0.96, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 340, damping: 22 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    filter: "blur(4px)",
    transition: { duration: 0.18, ease: "easeInOut" },
  },
};

const SuccessIcon = () => (
  <span aria-hidden="true" className="inline-block text-green-400">✓</span>
);
const ErrorIcon = () => (
  <span aria-hidden="true" className="inline-block text-red-500">⚠</span>
);
const InfoIcon = () => (
  <span aria-hidden="true" className="inline-block text-green-400">ⓘ</span>
);

function defaultIcon(type: ToastType): ReactNode {
  switch (type) {
    case "success": return <SuccessIcon />;
    case "error": return <ErrorIcon />;
    default: return <InfoIcon />;
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  const scheduleRemoval = useCallback(
    (toast: Toast) => {
      const duration = toast.duration ?? 3500;
      if (duration <= 0) return;
      timeoutsRef.current[toast.id] = setTimeout(() => removeToast(toast.id), duration);
    },
    [removeToast]
  );

  const addToast = useCallback(
    (input: Omit<Toast, "id" | "createdAt"> & { id?: string }) => {
      const id = input.id ?? crypto.randomUUID();
      const toast: Toast = {
        id,
        type: input.type,
        message: input.message,
        duration: input.duration,
        icon: input.icon ?? defaultIcon(input.type),
        createdAt: Date.now(),
      };
      setToasts((prev) => [...prev, toast]);
      scheduleRemoval(toast);
      return id;
    },
    [scheduleRemoval]
  );

  const success = useCallback(
    (message: string, opts?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>) =>
      addToast({ type: "success", message, ...opts }),
    [addToast]
  );

  const error = useCallback(
    (message: string, opts?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>) =>
      addToast({ type: "error", message, ...opts }),
    [addToast]
  );

  const info = useCallback(
    (message: string, opts?: Partial<Omit<Toast, "id" | "type" | "message" | "createdAt">>) =>
      addToast({ type: "info", message, ...opts }),
    [addToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, success, error, info }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-0 flex flex-col items-end gap-3 px-4 py-6 sm:p-6 z-[100]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="alert"
              className={[
                "pointer-events-auto w-full sm:w-80 rounded-xl shadow-lg p-4 flex gap-3",
                "backdrop-blur-md border",
                toast.type === "success"
                  ? "bg-green-900/30 border-green-700"
                  : toast.type === "error"
                  ? "bg-red-900/30 border-red-700"
                  : "bg-indigo-900/30 border-indigo-700",
              ].join(" ")}
            >
              <div className="text-xl flex items-start pt-0.5">{toast.icon}</div>
              <div className="flex-1">
                <p
                  className="text-sm font-medium leading-snug text-neutral-100"
                  style={{ wordBreak: "break-word" }}
                >
                  {toast.message}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-xs font-semibold uppercase tracking-wide text-green-400 hover:text-green-300 transition"
                  >
                    Close
                  </button>
                  {toast.type === "error" && (
                    <button
                      onClick={() => {
                        removeToast(toast.id);
                        info("Issue acknowledged.");
                      }}
                      className="text-xs font-semibold uppercase tracking-wide text-green-400 hover:text-green-300 transition"
                    >
                      Okay
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
