"use client";
import { useSession } from "@/components/auth/session-provider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  ChevronLeft,
  ChevronRight,
  Compass,
  Database,
  FileSearch,
  Gauge,
  List,
  Radar,
  Settings,
  Users,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearDemoSession } from "@/lib/auth";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      ["Home", "/dashboard", Gauge],
      ["Discover", "/discover", Compass],
      ["Signals", "/signals", Zap],
      ["Jobs", "/jobs", BriefcaseBusiness],
      ["Opportunities", "/opportunities/abc-fashion", Radar],
    ],
  },
  {
    label: "ORGANIZE",
    items: [
      ["Lists", "/lists", List],
      ["People", "/people", Users],
      ["Research", "/research", FileSearch],
    ],
  },
  {
    label: "PLATFORM",
    items: [
      ["ICP Builder", "/icp", Database],
      ["Integrations", "/integrations", Building2],
      ["Settings", "/settings", Settings],
    ],
  },
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
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-white py-4 text-ink transition-[width,padding] duration-300 ease-out lg:flex", collapsed ? "w-[76px] px-2" : "w-[264px] px-3")}>
        <div className="relative mb-5">
        <Link href="/dashboard" className={cn("flex items-center gap-3 rounded-2xl py-2 transition-[padding] duration-300", collapsed ? "justify-center px-1" : "px-3")} aria-label="DetectGrowth home">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_8px_20px_rgba(95,111,82,.20)]">
            DG
          </span>
          <span className={collapsed ? "hidden" : "block"}>
            <span className="block text-sm font-semibold leading-none">DetectGrowth</span>
            <span className="mt-1 block text-[11px] text-muted">B2B growth intelligence</span>
          </span>
        </Link>
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute -right-1 top-1/2 grid size-7 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border border-border bg-white text-muted shadow-sm transition hover:border-primary/30 hover:text-primary">{collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {navGroups.map(({ label, items }) => (
            <div key={label}>
              <div className={cn("px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-subtle", collapsed && "invisible h-2 pb-0")}>{label}</div>
              <div className="space-y-1">
                {items.map(([name, href, Icon]) => {
                  const active = pathname === href || (href.includes("#") ? pathname === href.split("#")[0] : pathname.startsWith(href));
                  return (
                    <Link
                      key={name}
                      href={href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition-[background-color,color,padding] duration-200 hover:bg-elevated hover:text-ink",
                        collapsed && "justify-center px-2",
                        active && "bg-primary-soft text-primary shadow-none"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className={cn("min-w-0 truncate", collapsed && "hidden")}>{name}</span>
                      {name === "Signals" ? (
                        <span className={cn("ml-auto rounded-full bg-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted", collapsed && "hidden")}>
                          24
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 space-y-3 pt-4">
          <div className={cn("rounded-2xl border border-border bg-elevated p-3 transition-[padding] duration-300", collapsed && "p-2")}>
            <div className="flex items-center justify-between gap-2">
              <div className={collapsed ? "hidden" : "block"}>
                <div className="text-sm font-medium">{user?.workspace ?? "Workspace"}</div>
                <div className="text-[11px] text-muted">Workspace active</div>
              </div>
              <Bell className={cn("size-4 text-subtle", collapsed && "mx-auto")} />
            </div>
            <div className={cn("mt-3 flex items-center gap-3", collapsed && "justify-center")}>
              <div className="grid size-10 place-items-center rounded-full bg-white text-muted">
                <CircleUserRound className="size-5" />
              </div>
              <div className={collapsed ? "hidden" : "min-w-0"}>
                <div className="truncate text-sm font-medium">{user?.name ?? "Account"}</div>
                <div className="text-[11px] text-muted">Demo account</div>
              </div>
            </div>
            <button type="button" onClick={signOut} title="Sign out" className={cn("mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-left text-xs font-medium text-muted transition hover:border-danger/30 hover:text-danger", collapsed && "px-0 text-center")}>{collapsed ? "↪" : "Sign out"}</button>
          </div>
        </div>
      </aside>

      {mobileVisible ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-[84vw] max-w-[320px] flex-col overflow-hidden bg-white px-3 py-4 text-ink shadow-[0_24px_80px_rgba(55,52,44,.18)]">
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl px-3 py-2">
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_8px_20px_rgba(95,111,82,.20)]">
                  DG
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-none">DetectGrowth</span>
                  <span className="mt-1 block text-[11px] text-muted">B2B growth intelligence</span>
                </span>
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
                          href={href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition duration-180 hover:bg-elevated hover:text-ink",
                            active && "bg-primary-soft text-primary shadow-none"
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="min-w-0 truncate">{name}</span>
                          {name === "Signals" ? (
                            <span className="ml-auto rounded-full bg-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                              24
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto shrink-0 space-y-3 pt-4">
          <div className="rounded-2xl border border-border bg-elevated p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{user?.workspace ?? "Workspace"}</div>
                <div className="text-[11px] text-muted">Workspace active</div>
                  </div>
              <Bell className="size-4 text-subtle" />
                </div>
                <div className="mt-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-white text-muted">
                    <CircleUserRound className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user?.name ?? "Account"}</div>
                <div className="text-[11px] text-muted">Demo account</div>
                  </div>
                </div>
                <button type="button" onClick={signOut} className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-left text-xs font-medium text-muted hover:text-ink">Sign out</button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
