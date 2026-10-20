"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageSquare, Send, Sparkles, X } from "lucide-react";

const prompts = ["Tailor my resume", "Improve a bullet", "Find missing keywords", "Prepare for an interview"];

type AICopilotDrawerProps = {
  triggerLabel?: string;
  className?: string;
  autoOpen?: boolean;
};

export function AICopilotDrawer({ triggerLabel = "AI copilot", className = "", autoOpen = false }: AICopilotDrawerProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const askCopilot = (value: string) => {
    const message = value.trim();
    if (!message) return;
    setMessages((current) => [...current, message]);
    setPrompt("");
    setThinking(true);
    window.setTimeout(() => setThinking(false), 850);
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-soft px-3 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm ${className}`}>
      <Sparkles className="size-4" />{triggerLabel}
    </button>

    <div className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <button type="button" aria-label="Close AI copilot" onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside role="dialog" aria-modal="true" aria-label="AI copilot" className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3"><span className="ai-orb grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><MessageSquare className="size-5" /></span><div><h2 className="text-base font-semibold text-ink">AI copilot</h2><p className="mt-0.5 text-xs text-muted">Your job-search assistant</p></div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close AI copilot" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-ink"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 shadow-sm"><p className="font-semibold text-ink">What would you like to work on?</p><p className="mt-1 text-muted">I can tailor your resume, strengthen your achievements, find missing keywords, or help you prepare for interviews.</p></div>
          <div className="mt-4 space-y-2">{messages.map((message, index) => <div key={`${message}-${index}`} className="ai-message ml-5 rounded-xl bg-primary px-4 py-3 text-sm leading-6 text-white shadow-sm">{message}</div>)}{thinking && <div className="ai-message flex w-fit items-center gap-1 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm" aria-label="AI is thinking"><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary" /></div>}</div>
        </div>
        <div className="border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2 overflow-x-auto pb-1">{prompts.map((item) => <button key={item} type="button" onClick={() => askCopilot(item)} className="shrink-0 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary">{item}</button>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); askCopilot(prompt); }} className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-elevated p-2 focus-within:border-primary/50"><input autoFocus={open} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask your copilot…" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-subtle" /><button type="submit" disabled={!prompt.trim()} aria-label="Send prompt" className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" /></button></form>
          <Link href="/resume/match" onClick={() => setOpen(false)} className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:underline">Open full AI workspace <ArrowRight className="size-3.5" /></Link>
        </div>
      </aside>
    </div>
  </>;
}
