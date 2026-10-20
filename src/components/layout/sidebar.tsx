"use client";
import { useSession } from "@/components/auth/session-provider";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleUserRound,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Globe2,
  Gauge,
  MessageCircle,
  Radar,
  Target,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearDemoSession } from "@/lib/auth";

const navGroups = [
  {
    label: "MAIN",
    items: [
      ["Dashboard", "/dashboard", Gauge],
    ],
  },
  {
    label: "JOB HUNT",
    items: [
      ["Application Tracker", "/applications", ClipboardList],
      ["Jobs", "/jobs", BriefcaseBusiness],
      // ["Opportunities", "/opportunities", Radar], // Growth opportunities — build later
    ],
  },
  {
    label: "RESUME & OPTIMIZATION",
    items: [
      ["Resume Builder", "/resume/create", FileText],
      ["ATS Scanner & Analysis", "/resume/analysis", CheckCircle2],
      ["Targeted Matching", "/resume/match", Target],
    ],
  },
  // {
  //   label: "PREP & NETWORK",
  //   items: [
  //     ["Interview Prep", "/interview-prep", MessageCircle],
  //     ["Networking & Portals", "/networking", Globe2],
  //   ],
  // },
] as const;

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const user = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const mobileVisible = mobileOpen;
  const drawer = useRef<HTMLElement>(null);
  const closeDrawer = useRef(onClose);
  closeDrawer.current = onClose;
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => Array.from(drawer.current?.querySelectorAll<HTMLElement>("a, button") ?? []);
    controls()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer.current();
      if (event.key === "Tab") { const items = controls(); const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", key); previous?.focus(); };
  }, [mobileOpen]);
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
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
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col overflow-visible border-r border-border bg-white py-4 text-ink transition-[width,padding] duration-300 ease-out lg:flex", collapsed ? "w-[76px] px-2" : "w-[264px] px-3")}>
        <div className="relative mb-5">
        <Link href="/dashboard" className={cn("flex items-center gap-3 rounded-2xl py-2 transition-[padding] duration-300", collapsed ? "justify-center px-1" : "px-3")} aria-label="DetectGrowth home">
          <span className={cn("block shrink-0 overflow-hidden", collapsed ? "h-10 w-10" : "w-[185px]")}>
            <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className={cn("brand-logo max-w-none object-contain", collapsed ? "h-10 w-[185px] object-left" : "h-auto w-[185px]")} />
          </span>
          <span className={collapsed ? "hidden" : "sr-only"}>DetectGrowth</span>
        </Link>
        <div className="relative"><button type="button" onClick={() => setWorkspaceOpen((open) => !open)} className={cn("mt-3 flex w-full items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2 text-left text-xs font-medium text-ink", collapsed && "justify-center px-2")} aria-label="Select workspace" aria-expanded={workspaceOpen}>
          <span className={collapsed ? "hidden" : "min-w-0 flex-1 truncate"}>Demo Workspace</span><ChevronDown className="size-3.5 shrink-0 text-muted" />
        </button>{workspaceOpen ? <div className={cn("absolute left-0 right-0 top-12 z-20 rounded-xl border border-border bg-white p-1.5 shadow-lg", collapsed && "left-10 w-44")}><button type="button" onClick={() => setWorkspaceOpen(false)} className="flex w-full items-center rounded-lg bg-primary-soft px-2.5 py-2 text-left text-xs font-medium text-primary">Demo Workspace<span className="ml-auto">✓</span></button><button type="button" onClick={() => setWorkspaceOpen(false)} className="mt-1 flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs text-muted hover:bg-elevated">Job Search Mode</button></div> : null}</div>
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-3 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-white text-muted shadow-sm transition hover:border-primary/30 hover:text-primary">{collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {navGroups.map(({ label, items }) => (
            <div key={label}>
              <div className={cn("px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-subtle", collapsed && "sr-only")}>{label}</div>
              <div className="space-y-1">
                {items.map(([name, href, Icon]) => {
                  const active = pathname === href || (href.includes("#") ? pathname === href.split("#")[0] : pathname.startsWith(href));
                  return (
                    <Link
                      key={name}
                      title={name}
                      aria-label={name}
                      href={href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition-[background-color,color,padding] duration-200 hover:bg-elevated hover:text-ink",
                        collapsed && "justify-center px-2",
                        active && "border-l-2 border-primary bg-primary-soft text-primary shadow-none"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className={cn("min-w-0 truncate", collapsed && "hidden")}>{name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
          {/* <Link href="/resume/upload" className={cn("flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-muted transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary", collapsed && "justify-center px-2")}><UploadCloud className="size-4 shrink-0" /><span className={collapsed ? "hidden" : "block"}>Upload resume</span></Link> */}
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
              <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
                <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className="brand-logo h-auto w-[185px] object-contain" />
              </Link>
              <button aria-label="Close navigation" onClick={onClose} className="rounded-full border border-border p-2 text-muted">
                <X className="size-4" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              {navGroups.map(({ label, items }) => (
                <div key={label}>
                  <div className="px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-subtle">{label}</div>
                  <div className="space-y-1">
                    {items.map(([name, href, Icon]) => {
                      const active = pathname === href || (href.includes("#") ? pathname === href.split("#")[0] : pathname.startsWith(href));
                      return (
                        <Link
                          key={name}
                      title={name}
                      aria-label={name}
                          href={href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition duration-180 hover:bg-elevated hover:text-ink",
                            active && "border-l-2 border-primary bg-primary-soft text-primary shadow-none"
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="min-w-0 truncate">{name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto shrink-0 space-y-2 border-t border-border pt-3">
              {/* <Link href="/resume/upload" onClick={onClose} className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-muted hover:border-primary/30 hover:bg-primary-soft hover:text-primary"><UploadCloud className="size-4" />Upload resume</Link> */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-elevated p-2.5"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-muted"><CircleUserRound className="size-5" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{user?.name ?? "Demo User"}</div><div className="truncate text-[11px] text-muted">{user?.workspace ?? "Demo Workspace"} · {user?.isDemo ? "Demo account" : "Workspace member"}</div></div><button type="button" onClick={signOut} className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-white hover:text-danger">Sign out</button></div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
