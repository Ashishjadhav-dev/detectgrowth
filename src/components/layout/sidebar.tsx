"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  Compass,
  Database,
  FileSearch,
  Gauge,
  List,
  Mail,
  Radar,
  Settings,
  Users,
  Workflow,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

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
  {
    label: "ENGAGE",
    items: [
      ["Sequences", "/dashboard#sequences", Mail],
      ["Workflows", "/dashboard#workflows", Workflow],
      ["Analytics", "/dashboard#analytics", BarChart3],
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
  const pathname = usePathname();
  const mobileVisible = mobileOpen;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-border bg-white px-3 py-4 text-ink lg:flex">
        <Link href="/dashboard" className="mb-5 flex items-center gap-3 rounded-2xl px-3 py-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_8px_20px_rgba(95,111,82,.20)]">
            DG
          </span>
          <span>
            <span className="block text-sm font-semibold leading-none">DetectGrowth</span>
            <span className="mt-1 block text-[11px] text-muted">B2B growth intelligence</span>
          </span>
        </Link>

        <nav className="space-y-5 overflow-y-auto pr-1">
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
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition duration-180 hover:bg-elevated hover:text-ink",
                        active && "bg-primary-soft text-primary shadow-none"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{name}</span>
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

        <div className="mt-auto space-y-3 pt-4">
          <div className="rounded-2xl border border-border bg-elevated p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">Morgan Growth Team</div>
                <div className="text-[11px] text-muted">Workspace active</div>
              </div>
              <Bell className="size-4 text-subtle" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-white text-muted">
                <CircleUserRound className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Ashish Jadhav</div>
                <div className="text-[11px] text-muted">Growth Team</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileVisible ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation overlay" className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-[84vw] max-w-[320px] flex-col bg-white px-3 py-4 text-ink shadow-[0_24px_80px_rgba(55,52,44,.18)]">
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

            <nav className="space-y-5 overflow-y-auto pr-1">
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
                          <span>{name}</span>
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

            <div className="mt-auto space-y-3 pt-4">
          <div className="rounded-2xl border border-border bg-elevated p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">Morgan Growth Team</div>
                <div className="text-[11px] text-muted">Workspace active</div>
                  </div>
              <Bell className="size-4 text-subtle" />
                </div>
                <div className="mt-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-white text-muted">
                    <CircleUserRound className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">Ashish Jadhav</div>
                <div className="text-[11px] text-muted">Growth Team</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
