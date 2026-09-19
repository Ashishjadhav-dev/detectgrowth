"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
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
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setPanel(null); setSearchOpen(false); } if ((event.metaKey || event.ctrlKey) && event.key === "k" && pathname !== "/jobs") { event.preventDefault(); setSearchOpen(true); requestAnimationFrame(() => search.current?.focus()); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [pathname]);
  const unread = signals.filter((signal) => !readIds.includes(signal.id));
  const title = pathname.split("/")[1]?.replaceAll("-", " ") ?? "Workspace";
  return <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur"><div className="flex min-h-16 flex-wrap items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
    <Button variant="ghost" className="lg:hidden" aria-label="Open navigation" onClick={onMenuClick}><Menu className="size-5" /></Button>
    <span className="min-w-0 flex-1 truncate text-sm font-semibold capitalize sm:flex-none">{title === "dashboard" ? "Growth overview" : title}</span>
    <form className={`${searchOpen ? "order-last flex basis-full" : "hidden"} min-w-0 flex-1 items-center gap-2 md:order-none md:flex md:basis-auto`} onSubmit={(event) => { event.preventDefault(); if (query.trim()) { router.push(`/discover?query=${encodeURIComponent(query.trim())}`); setSearchOpen(false); } }}>
      <input ref={search} aria-label="Search companies" placeholder="Search companies…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-sm" /><Button type="submit" variant="ghost" aria-label="Submit company search"><Search className="size-4" /></Button>
    </form>
    <Button variant="ghost" className="md:hidden" aria-label="Open search" onClick={() => { setSearchOpen((value) => !value); requestAnimationFrame(() => search.current?.focus()); }}><Search className="size-4" /></Button>
    <div ref={root} className="relative flex shrink-0 gap-1">
      <Button variant="ghost" aria-label={`Notifications, ${unread.length} unread`} aria-expanded={panel === "notifications"} onClick={() => setPanel(panel === "notifications" ? null : "notifications")}><Bell className="size-4" />{unread.length ? <span className="text-xs">{unread.length}</span> : null}</Button>
      <Button variant="ghost" aria-label="Account menu" aria-expanded={panel === "profile"} onClick={() => setPanel(panel === "profile" ? null : "profile")}><span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("") ?? "DG"}</span><span className="hidden max-w-32 truncate text-xs sm:block">{user?.name}</span></Button>
      {panel ? <section aria-label={panel === "profile" ? "Account" : "Notifications"} className="absolute right-0 top-12 z-40 max-h-[70vh] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-border bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{panel === "profile" ? "Your account" : "Notifications"}</h2><button aria-label="Close panel" className="p-2" onClick={() => setPanel(null)}><X className="size-4" /></button></div>{panel === "profile" ? <div className="space-y-3"><p className="break-words text-sm">{user?.name}</p><p className="break-all text-xs text-muted">{user?.email}</p><p className="break-words text-xs text-muted">{user?.workspace}</p><Button variant="secondary" className="w-full" onClick={() => router.push("/settings")}>Account settings</Button><Button variant="ghost" className="w-full" onClick={async () => { try { await clearDemoSession(); window.location.assign("/auth"); } catch { setError("Unable to sign out. Please retry."); } }}>Sign out</Button></div> : <div className="space-y-2">{signals.length ? signals.map((signal) => <button key={signal.id} className={`w-full rounded-xl border border-border p-3 text-left text-sm ${readIds.includes(signal.id) ? "text-muted" : "bg-primary-soft text-ink"}`} onClick={() => router.push("/signals")}><span className="block font-medium">{signal.type}</span><span className="mt-1 block text-xs">{signal.company}</span></button>) : <p className="text-sm text-muted">You are all caught up.</p>}<Button variant="ghost" disabled={!unread.length} onClick={async () => { const ids = signals.map((signal) => signal.id); try { await apiRequest("/api/v1/settings/preferences", { method: "PATCH", body: JSON.stringify({ readSignals: ids }) }); setReadIds(ids); } catch { setError("Unable to update notifications. Please retry."); } }}>Mark all as read</Button></div>}{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</section> : null}
    </div>
  </div></header>;
}
