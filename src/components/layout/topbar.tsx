"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Menu, RefreshCw, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/session-provider";
import { clearDemoSession } from "@/lib/auth";
import { apiRequest } from "@/lib/api/client";
import { listSignals, type ApiSignal } from "@/lib/api/signals";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const [signals, setSignals] = useState<ApiSignal[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listSignals().then(setSignals).catch(() => {});
    apiRequest<{ readSignals?: string[] }>("/api/v1/settings/preferences").then((data) => setReadIds(data.readSignals ?? [])).catch(() => {});
  }, [pathname]);
  useEffect(() => { setPanel(null); }, [pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setPanel(null); };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPanel(null); setSearchOpen(false); }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); setSearchOpen(true); requestAnimationFrame(() => search.current?.focus()); }
    };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, []);

  const unread = signals.filter((signal) => !readIds.includes(signal.id));
  const titleMap: Record<string, string> = { dashboard: "Growth Overview", applications: "Application Tracker", resume: "Resume Tools", "interview-prep": "Interview Prep", networking: "Networking & Portals" };
  const title = titleMap[pathname.split("/")[1] ?? ""] ?? pathname.split("/")[1]?.replaceAll("-", " ") ?? "Workspace";
  const initials = user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("") ?? "DU";

  return <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur"><div className="flex min-h-14 items-center gap-2 px-3 sm:gap-3 sm:px-6">
    <Button variant="ghost" className="h-9 w-9 shrink-0 p-0 lg:hidden" aria-label="Open navigation" onClick={onMenuClick}><Menu className="size-4" /></Button>
    <div className="hidden min-w-[190px] shrink-0 items-center gap-2 sm:flex"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{title}</p><p className="truncate text-[11px] text-muted">{user?.workspace ?? "Demo Workspace"}</p></div></div>
    <form className={`${searchOpen ? "flex" : "hidden md:flex"} relative min-w-0 flex-1 items-center`} onSubmit={(event) => { event.preventDefault(); if (query.trim()) { router.push(`/jobs?query=${encodeURIComponent(query.trim())}`); setSearchOpen(false); } }}><Search className="pointer-events-none absolute left-3 size-4 text-muted" /><input ref={search} aria-label="Global search" placeholder="Search jobs, companies, or tasks…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-primary/40 focus:ring-2 focus:ring-primary/10" /></form>
    <Button variant="ghost" className="h-9 w-9 shrink-0 p-0 md:hidden" aria-label="Open search" onClick={() => { setSearchOpen((value) => !value); requestAnimationFrame(() => search.current?.focus()); }}><Search className="size-4" /></Button>
    <div className="hidden h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-elevated px-3 text-xs font-medium text-muted lg:flex"><span className="size-2 rounded-full bg-emerald-500" />Job Search Mode</div>
    {pathname === "/dashboard" ? <Button variant="ghost" className="h-9 w-9 shrink-0 p-0" aria-label="Refresh dashboard" onClick={() => window.dispatchEvent(new Event("dashboard-refresh"))}><RefreshCw className="size-4" /></Button> : null}
    <div ref={root} className="relative flex shrink-0 items-center gap-1.5">
      <Button variant="ghost" className="h-9 w-9 shrink-0 p-0" aria-label={`Notifications, ${unread.length} unread`} aria-expanded={panel === "notifications"} onClick={() => setPanel(panel === "notifications" ? null : "notifications")}><Bell className="size-4" />{unread.length ? <span className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white">{unread.length}</span> : null}</Button>
      <Button variant="ghost" className="h-9 gap-2 rounded-xl px-1.5 sm:px-2" aria-label="Account menu" aria-expanded={panel === "profile"} onClick={() => setPanel(panel === "profile" ? null : "profile")}><span className="grid size-7 place-items-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">{initials}</span><span className="hidden max-w-28 truncate text-xs font-medium text-ink sm:block">{user?.name ?? "Demo User"}</span></Button>
      {panel ? <section aria-label={panel === "profile" ? "Account" : "Notifications"} className="absolute right-0 top-11 z-40 max-h-[70vh] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{panel === "profile" ? "Your account" : "Notifications"}</h2><button aria-label="Close panel" className="p-2" onClick={() => setPanel(null)}><X className="size-4" /></button></div>{panel === "profile" ? <div className="space-y-3"><p className="break-words text-sm">{user?.name ?? "Demo User"}</p><p className="break-all text-xs text-muted">{user?.email}</p><p className="break-words text-xs text-muted">{user?.workspace ?? "Demo Workspace"}</p><Button variant="secondary" className="w-full" onClick={() => router.push("/settings")}>Account settings</Button><Button variant="ghost" className="w-full" onClick={async () => { try { await clearDemoSession(); window.location.assign("/auth"); } catch { setError("Unable to sign out. Please retry."); } }}>Sign out</Button></div> : <div className="space-y-2">{signals.length ? signals.map((signal) => <button key={signal.id} className={`w-full rounded-xl border border-border p-3 text-left text-sm ${readIds.includes(signal.id) ? "text-muted" : "bg-primary-soft text-ink"}`} onClick={() => router.push("/signals")}><span className="block font-medium">{signal.type}</span><span className="mt-1 block text-xs">{signal.company}</span></button>) : <p className="text-sm text-muted">You are all caught up.</p>}<Button variant="ghost" disabled={!unread.length} onClick={async () => { const ids = signals.map((signal) => signal.id); try { await apiRequest("/api/v1/settings/preferences", { method: "PATCH", body: JSON.stringify({ readSignals: ids }) }); setReadIds(ids); } catch { setError("Unable to update notifications. Please retry."); } }}>Mark all as read</Button></div>}{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</section> : null}
    </div>
  </div></header>;
}
