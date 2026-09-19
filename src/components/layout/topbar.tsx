"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CircleHelp, LayoutGrid, Menu, Search, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Home Dashboard",
  "/discover": "Discover",
  "/signals": "Signals",
  "/jobs": "Jobs",
  "/opportunities": "Opportunities",
  "/people": "People",
  "/lists": "Lists",
  "/research": "Research",
  "/settings": "Settings",
  "/integrations": "Integrations",
  "/icp": "ICP Builder",
};

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"workspace" | "notifications" | "help" | null>(null);
  const pageTitle = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ?? "Home Dashboard";

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const submitSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/discover?query=${encodeURIComponent(trimmed)}`);
  };

  const togglePanel = (nextPanel: "workspace" | "notifications" | "help") => setPanel((current) => current === nextPanel ? null : nextPanel);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4 md:px-6">
        <Button variant="ghost" className="shrink-0 lg:hidden" aria-label="Open navigation" onClick={onMenuClick}><Menu className="size-5" /></Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1 sm:flex-none sm:max-w-[280px]"><div className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{pageTitle}</div><div className="mt-0.5 hidden truncate text-sm text-muted sm:block">Overview of live signals and pipeline activity</div></div>
          <div className="hidden max-w-[720px] flex-1 md:block"><SearchInput value={query} onChange={setQuery} onSubmit={submitSearch} onClear={() => setQuery("")} inputRef={searchRef} placeholder="Search companies, people, signals..." /></div>
        </div>

        <div className="relative flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" className="hidden md:inline-flex" aria-label="Focus search" title="Search (⌘ K)" onClick={() => searchRef.current?.focus()}><Sparkles className="size-4" /></Button>
          <Button variant="ghost" className="hidden md:inline-flex" aria-label="Switch workspace" title="Switch workspace" onClick={() => togglePanel("workspace")}><LayoutGrid className="size-4" /></Button>
          <Button variant="ghost" aria-label="Notifications" title="Notifications" onClick={() => togglePanel("notifications")}><Bell className="size-4" /><span className="ml-1 inline-grid size-2 rounded-full bg-danger" /></Button>
          <Button variant="ghost" className="hidden sm:inline-flex" aria-label="Help" title="Help" onClick={() => togglePanel("help")}><CircleHelp className="size-4" /></Button>
          <button type="button" onClick={() => router.push("/settings")} className="ml-1 flex items-center gap-2 rounded-full border border-border bg-white px-1.5 py-1 pr-2 text-left shadow-[0_1px_1px_rgba(23,27,43,.02)] transition hover:border-primary/30 sm:px-2 sm:pr-3"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">AJ</div><div className="hidden sm:block"><div className="text-xs font-medium leading-none text-ink">Ashish Jadhav</div><div className="mt-1 text-[11px] text-muted">Morgan Growth Team</div></div></button>

          {panel ? <div className="absolute right-0 top-12 z-40 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-white p-4 shadow-[0_20px_60px_rgba(23,27,43,.16)]">
            <div className="flex items-center justify-between gap-3"><div className="text-sm font-semibold text-ink">{panel === "workspace" ? "Switch workspace" : panel === "notifications" ? "Notifications" : "Help center"}</div><button type="button" aria-label="Close panel" onClick={() => setPanel(null)} className="rounded-lg p-1 text-muted hover:bg-elevated hover:text-ink"><X className="size-4" /></button></div>
            {panel === "workspace" ? <div className="mt-3 space-y-2"><button type="button" onClick={() => setPanel(null)} className="flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary-soft p-3 text-left"><span><span className="block text-sm font-medium text-ink">Morgan Growth Team</span><span className="text-xs text-muted">Active workspace</span></span><span className="size-2 rounded-full bg-success" /></button><button type="button" onClick={() => router.push("/settings")} className="w-full rounded-xl border border-dashed border-border p-3 text-left text-sm text-muted hover:bg-elevated">Manage workspaces</button></div> : null}
            {panel === "notifications" ? <div className="mt-3 space-y-2"><div className="rounded-xl border border-border bg-elevated p-3"><div className="text-sm font-medium text-ink">New hiring signal detected</div><div className="mt-1 text-xs text-muted">PQR Electronics · 1 hour ago</div></div><div className="rounded-xl border border-border bg-elevated p-3"><div className="text-sm font-medium text-ink">Pipeline review is due today</div><div className="mt-1 text-xs text-muted">Open your priority tasks to review it.</div></div><button type="button" onClick={() => router.push("/signals")} className="w-full pt-1 text-left text-sm font-medium text-primary">View all signals</button></div> : null}
            {panel === "help" ? <div className="mt-3 space-y-2"><button type="button" onClick={() => router.push("/research")} className="w-full rounded-xl border border-border p-3 text-left text-sm text-ink hover:bg-elevated">How to use research</button><button type="button" onClick={() => router.push("/integrations")} className="w-full rounded-xl border border-border p-3 text-left text-sm text-ink hover:bg-elevated">Connect a data source</button><a href="mailto:support@detectgrowth.com" className="block rounded-xl border border-border p-3 text-sm text-ink hover:bg-elevated">Contact support</a></div> : null}
          </div> : null}
        </div>
      </div>
    </header>
  );
}
