"use client";
import { useSession } from "@/components/auth/session-provider";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  ListChecks,
  ScanSearch,
  CheckCircle2,
  CircleUserRound,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Handshake,
  MessageSquare,
  Radar,
  ScanLine,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearDemoSession } from "@/lib/auth";
import { isCareerPath } from "./workspace-mode";

const growthLinks = [
  ["Lead discovery", "/leads", Handshake],
  ["Watchlists", "/watchlists", ScanLine],
  ["Growth opportunities", "/opportunities", Radar],
  ["Companies", "/discover", Building2],
  ["Signals", "/signals", ScanSearch],
  ["Lists", "/lists", ListChecks],
] as const;

const careerLinks = [
  ["Jobs", "/jobs", BriefcaseBusiness],
  ["Applications", "/applications", ClipboardList],
  ["Resume Builder", "/resume/create", FileText],
  ["ATS Scanner & Analysis", "/resume/analysis", CheckCircle2],
  ["Interview Prep", "/interview-prep", MessageSquare],
] as const;

function WorkspaceNav({ pathname, collapsed = false, onNavigate }: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const career = isCareerPath(pathname);
  const links = [["Dashboard", "/dashboard", Gauge] as const, ...(career ? careerLinks : growthLinks)];
  return <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" aria-label={career ? "Career navigation" : "Growth navigation"}>
    <div aria-label="Product areas" role="group" className={cn("mb-4 grid gap-1 rounded-xl border border-border bg-elevated p-1", !collapsed && "grid-cols-2")}>
      {([["Growth", "/leads", Radar, !career], ["Career", "/jobs", BriefcaseBusiness, career]] as const).map(([label, href, Icon, active]) =>
        <Link key={href} href={href} onClick={onNavigate} aria-label={`Open ${label.toLowerCase()} workspace`} title={label}
          className={cn("flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-sm font-medium text-muted hover:text-ink", active && "bg-white text-primary shadow-sm")}>
          <Icon aria-hidden="true" className="size-4 shrink-0" />{!collapsed && label}
        </Link>
      )}
    </div>
    <div className="space-y-1">
      {links.map(([name, href, Icon]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} title={name} aria-label={name} aria-current={active ? "page" : undefined} href={href} onClick={onNavigate}
          className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink", collapsed && "justify-center px-2", active && "bg-primary-soft font-semibold text-primary")}>
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {!collapsed && <span className="min-w-0 truncate">{name}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const user = useSession();
  const pathname = usePathname();
  const mobileVisible = mobileOpen;
  const drawer = useRef<HTMLElement>(null);
  const closeDrawer = useRef(onClose);
  closeDrawer.current = onClose;
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const controls = () => Array.from(drawer.current?.querySelectorAll<HTMLElement>("a, button") ?? []);
    controls()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer.current();
      if (event.key === "Tab") { const items = controls(); const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, [mobileOpen]);
  const [collapsed, setCollapsed] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const signOut = async () => { try { await clearDemoSession(); window.location.assign("/auth"); } catch { setSignOutError("Unable to sign out. Please try again."); } };

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("detectgrowth-sidebar-collapsed") === "true");
  }, []);

  const toggleCollapsed = () => setCollapsed((current) => {
    const next = !current;
    window.localStorage.setItem("detectgrowth-sidebar-collapsed", String(next));
    return next;
  });

  return (
    <>
      {signOutError ? <div role="alert" className="fixed bottom-4 right-4 z-[100] rounded-xl bg-white p-4 text-red-700 shadow-lg">{signOutError}</div> : null}
      <aside className={cn("hidden shrink-0 flex-col border-r border-border bg-white py-4 text-ink transition-[width,padding] duration-300 ease-out lg:flex", collapsed ? "w-[76px] px-2" : "w-[264px] px-3")}>
        <div className="relative mb-5">
        <Link href="/dashboard" className={cn("flex items-center gap-3 rounded-2xl py-2 transition-[padding] duration-300", collapsed ? "justify-center px-1" : "px-3")} aria-label="DetectGrowth home">
          <span className={cn("block shrink-0 overflow-hidden", collapsed ? "h-10 w-10" : "w-[185px]")}>
            <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className={cn("brand-logo max-w-none object-contain", collapsed ? "h-10 w-[185px] object-left" : "h-auto w-[185px]")} />
          </span>
          <span className={collapsed ? "hidden" : "sr-only"}>DetectGrowth</span>
        </Link>
        {!collapsed && <p className="mt-3 truncate rounded-xl border border-border bg-elevated px-3 py-2 text-xs font-medium text-ink">{user?.workspace ?? "DetectGrowth workspace"}</p>}
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-white text-muted shadow-sm transition hover:border-primary/30 hover:text-primary">{collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
        </div>

        <WorkspaceNav pathname={pathname} collapsed={collapsed} />

        <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
          <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-elevated p-2.5", collapsed && "flex-col gap-2 p-2")}>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-muted"><CircleUserRound className="size-5" /></div>
            <div className={collapsed ? "hidden" : "min-w-0 flex-1"}><div className="truncate text-sm font-medium">{user?.name ?? "Demo User"}</div><div className="truncate text-[11px] text-muted">{user?.workspace ?? "Demo Workspace"} · {user?.isDemo ? "Demo account" : "Workspace member"}</div></div>
            <button type="button" onClick={signOut} title={`Sign out ${user?.name ?? "Demo User"}`} aria-label="Sign out" className={cn("shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-white hover:text-danger", collapsed && "hidden")}>Sign out</button>
          </div>
        </div>
      </aside>

      {mobileVisible ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
          <aside ref={drawer} role="dialog" aria-modal="true" aria-label="Navigation" className="absolute left-0 top-0 flex h-full w-[84vw] max-w-[320px] flex-col overflow-hidden bg-white px-3 py-4 text-ink shadow-[0_24px_80px_rgba(55,52,44,.18)]">
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl px-3 py-2">
              <Link href="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3">
                <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className="brand-logo h-auto w-[185px] object-contain" />
              </Link>
              <button aria-label="Close navigation" onClick={onClose} className="rounded-full border border-border p-2 text-muted">
                <X className="size-4" />
              </button>
            </div>

            <WorkspaceNav pathname={pathname} onNavigate={onClose} />

            <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-elevated p-2.5"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-muted"><CircleUserRound className="size-5" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{user?.name ?? "Demo User"}</div><div className="truncate text-[11px] text-muted">{user?.workspace ?? "Demo Workspace"} · {user?.isDemo ? "Demo account" : "Workspace member"}</div></div><button type="button" onClick={signOut} className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-white hover:text-danger">Sign out</button></div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
