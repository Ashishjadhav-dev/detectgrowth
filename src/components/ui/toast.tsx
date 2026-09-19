"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";

type ToastItem = { id: number; message: string };
type ToastContextValue = { showToast: (message: string) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setItems((current) => [...current, { id, message }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3600);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">{items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-ink shadow-[0_16px_40px_rgba(23,27,43,.14)]"><CheckCircle2 className="size-4 shrink-0 text-success" /><span className="min-w-0 flex-1">{item.message}</span><button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Dismiss notification" className="text-muted hover:text-ink"><X className="size-4" /></button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
