"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialog({ open, title, description, onClose, children, className = "" }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; className?: string }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const controls = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []);
    controls()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const elements = controls(); const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [open]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-5 shadow-[0_24px_90px_rgba(23,27,43,.22)] sm:p-6 ${className}`}><div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-lg font-semibold text-ink">{title}</h2>{description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}</div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-xl p-2 text-muted transition hover:bg-elevated hover:text-ink"><X className="size-4" /></button></div><div className="mt-5">{children}</div></section></div>;
}
