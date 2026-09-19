"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Score } from "@/components/ui/score";
import { getDashboardData, updateDashboardTask, type DashboardData } from "@/lib/api/dashboard";
import { demoDashboard } from "@/data/demo";

function TrendChart() {
  return (
    <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(91,53,230,.09),rgba(91,53,230,0))] px-2 pt-4 sm:h-60 sm:px-4">
      <div className="pointer-events-none absolute inset-x-3 top-4 bottom-8 flex flex-col justify-between sm:inset-x-4">
        {["100", "75", "50", "25", "0"].map((label) => (
          <div key={label} className="flex items-center gap-2 text-[10px] text-subtle">
            <span className="w-6 text-right">{label}</span>
            <span className="h-px flex-1 border-t border-dashed border-border" />
          </div>
        ))}
      </div>
      <svg viewBox="0 0 640 190" preserveAspectRatio="none" className="absolute inset-x-9 top-4 h-[calc(100%-44px)] w-[calc(100%-52px)] sm:inset-x-12 sm:w-[calc(100%-64px)]" aria-label="Growth score trend chart" role="img">
        <defs>
          <linearGradient id="growth-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5b35e6" stopOpacity=".25" />
            <stop offset="1" stopColor="#5b35e6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 150 C50 145 60 128 110 132 S160 120 205 126 S250 92 300 106 S345 95 390 96 S430 64 480 78 S530 54 570 58 S615 30 640 38 L640 190 L0 190 Z" fill="url(#growth-fill)" />
        <path d="M0 150 C50 145 60 128 110 132 S160 120 205 126 S250 92 300 106 S345 95 390 96 S430 64 480 78 S530 54 570 58 S615 30 640 38" fill="none" stroke="#5b35e6" strokeLinecap="round" strokeWidth="3" />
        <circle cx="640" cy="38" r="5" fill="#fff" stroke="#5b35e6" strokeWidth="3" />
      </svg>
      <div className="absolute inset-x-10 bottom-2 flex justify-between text-[10px] text-subtle sm:inset-x-14"><span>Jun 01</span><span>Jun 08</span><span>Jun 15</span><span>Jun 22</span><span>Today</span></div>
    </div>
  );
}

function Kpi({ label, value, delta, icon, tone = "primary" }: { label: string; value: string; delta: string; icon: React.ReactNode; tone?: "primary" | "green" | "blue" | "amber" }) {
  const tones = { primary: "bg-primary-soft text-primary", green: "bg-emerald-50 text-success", blue: "bg-blue-50 text-info", amber: "bg-amber-50 text-warning" };
  return (
    <Card className="glass-card min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-muted">{label}</div>
          <div className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</div>
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-success"><TrendingUp className="size-3" />{delta}</div>
        </div>
        <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

export function DashboardView() {
  const [dashboard, setDashboard] = useState<DashboardData>(demoDashboard);
  const [dashboardError, setDashboardError] = useState<string | null>("Showing demo data until the API is connected.");
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>(demoDashboard.tasks.filter((task) => task.completed).map((task) => task.id));

  const loadDashboard = () => {
    setLoading(true);
    getDashboardData()
      .then((data) => { setDashboard(data); setDashboardError(null); })
      .catch(() => { setDashboard(demoDashboard); setDashboardError("Showing demo data until the API is connected."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    getDashboardData().then((data) => { if (!cancelled) { setDashboard(data); setDashboardError(null); } }).catch(() => { if (!cancelled) { setDashboard(demoDashboard); setDashboardError("Showing demo data until the API is connected."); } });
    const refreshTimer = window.setInterval(() => { if (!cancelled) loadDashboard(); }, 30_000);
    return () => { cancelled = true; window.clearInterval(refreshTimer); };
  }, []);

  const summary = dashboard.summary;
  const completedCount = completedTasks.length;
  const openTasks = useMemo(() => dashboard.tasks.filter((task) => !completedTasks.includes(task.id)), [completedTasks, dashboard.tasks]);

  const toggleTask = (id: string, checked: boolean) => {
    setCompletedTasks((current) => checked ? [...new Set([...current, id])] : current.filter((taskId) => taskId !== id));
    if (!id.startsWith("demo-")) void updateDashboardTask(id, checked);
  };

  return (
    <div className="min-w-0 space-y-5 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Growth overview</div>
          <h1 className="page-title mt-2">Good morning, Ashish</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">A clear view of the accounts, signals, and follow-ups that need your attention today.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="secondary" size="sm"><CalendarDays className="size-4" />Last 30 days</Button>
          <Button variant="secondary" size="sm" onClick={loadDashboard} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </section>

      {dashboardError ? <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"><CircleAlert className="size-4 shrink-0" />{dashboardError}</div> : null}

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="New opportunities" value={summary.newOpportunities} delta={`${summary.growthDelta} vs last period`} icon={<Target className="size-4" />} />
        <Kpi label="Companies surging" value={summary.companiesSurging} delta="8% above average" icon={<TrendingUp className="size-4" />} tone="green" />
        <Kpi label="New signals" value={summary.newSignals} delta="12 high priority" icon={<Zap className="size-4" />} tone="amber" />
        <Kpi label="People discovered" value={summary.peopleDiscovered} delta="23 new this week" icon={<Users className="size-4" />} tone="blue" />
        <Kpi label="Pipeline value" value={summary.pipelineValue} delta="18% this month" icon={<CircleDollarSign className="size-4" />} tone="green" />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
        <Card className="glass-card min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="section-title">Growth score trend</h2><p className="mt-1 text-sm text-muted">Average score across tracked companies</p></div>
            <div className="text-right"><div className="text-2xl font-semibold text-ink">{summary.averageGrowthScore}</div><div className="text-xs font-medium text-success">{summary.growthDelta} this month</div></div>
          </div>
          <TrendChart />
          <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-elevated p-3"><div className="text-[11px] text-muted">Top signal</div><div className="mt-1 truncate text-sm font-semibold text-ink">{dashboard.signals[0]?.type ?? "—"}</div></div><div className="rounded-xl bg-elevated p-3"><div className="text-[11px] text-muted">Confidence</div><div className="mt-1 text-sm font-semibold text-ink">{dashboard.signals[0]?.confidence ?? 0}%</div></div><div className="rounded-xl bg-elevated p-3"><div className="text-[11px] text-muted">Active accounts</div><div className="mt-1 text-sm font-semibold text-ink">{summary.companiesSurging}</div></div></div>
        </Card>

        <Card className="glass-card min-w-0 p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="section-title">My priorities</h2><p className="mt-1 text-sm text-muted">Follow-ups for today</p></div><Badge className="bg-primary-soft text-primary">{openTasks.length} open</Badge></div>
          <div className="mt-4 space-y-2.5">
            {dashboard.tasks.map((task) => <label key={task.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${completedTasks.includes(task.id) ? "border-emerald-100 bg-emerald-50/50" : "border-border bg-white hover:border-primary/30"}`}><input type="checkbox" checked={completedTasks.includes(task.id)} onChange={(event) => toggleTask(task.id, event.target.checked)} className="mt-0.5 size-4 rounded border-border text-primary" /><span className="min-w-0 flex-1"><span className={`block text-sm font-medium ${completedTasks.includes(task.id) ? "text-muted line-through" : "text-ink"}`}>{task.label}</span><span className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 className="size-3" />{task.due}<span>·</span>{task.urgency} priority</span></span>{completedTasks.includes(task.id) ? <Check className="size-4 shrink-0 text-success" /> : null}</label>)}
          </div>
          <Link href="/lists" className="mt-4 flex items-center justify-between text-sm font-medium text-primary">View task list<ChevronRight className="size-4" /></Link>
        </Card>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
        <Card className="glass-card min-w-0 overflow-hidden p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="section-title">Top opportunities</h2><p className="mt-1 text-sm text-muted">Accounts with the strongest combination of fit and intent</p></div><Link href="/opportunities" className="text-sm font-medium text-primary">View pipeline</Link></div>
          <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[620px] border-collapse"><thead className="bg-elevated text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle"><tr><th className="px-3 py-3">Company</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Stage</th><th className="px-3 py-3">Signal</th><th className="px-3 py-3" /></tr></thead><tbody>{dashboard.opportunities.slice(0, 5).map((opportunity) => <tr key={opportunity.id} className="border-t border-border hover:bg-elevated/50"><td className="px-3 py-3"><div className="flex items-center gap-2.5"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-[11px] font-semibold text-primary">{opportunity.company.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-medium text-ink">{opportunity.company}</div><div className="truncate text-xs text-muted">{opportunity.industry} · {opportunity.employees}</div></div></div></td><td className="px-3 py-3"><Score value={opportunity.score} compact /></td><td className="px-3 py-3"><Badge className="bg-primary-soft text-primary">Active</Badge></td><td className="max-w-[180px] truncate px-3 py-3 text-xs text-muted">{opportunity.signal}</td><td className="px-3 py-3"><Link href={`/opportunities/${opportunity.id}`} aria-label={`Open ${opportunity.company}`}><ArrowUpRight className="size-4 text-primary" /></Link></td></tr>)}</tbody></table></div>
        </Card>

        <Card className="glass-card min-w-0 p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="section-title">Latest signals</h2><p className="mt-1 text-sm text-muted">What changed recently</p></div><Link href="/signals" className="text-sm font-medium text-primary">View all</Link></div>
          <div className="space-y-2.5">{dashboard.signals.slice(0, 4).map((signal) => <Link href="/signals" key={signal.id} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition hover:border-primary/30"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Zap className="size-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink">{signal.type}</div><div className="mt-1 truncate text-xs text-muted">{signal.company}</div></div><div className="shrink-0 text-right"><div className="text-sm font-semibold text-ink">{signal.confidence}%</div><div className="text-[10px] text-success">{signal.impact}</div></div></Link>)}</div>
        </Card>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <Card className="glass-card min-w-0 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="section-title">Pipeline health</h2><p className="mt-1 text-sm text-muted">Current opportunities by stage</p></div><Link href="/opportunities" aria-label="Open pipeline"><ChevronRight className="size-5 text-primary" /></Link></div><div className="space-y-4">{dashboard.pipeline.map((stage, index) => { const count = Number.parseInt(stage.count, 10) || 0; const max = Math.max(...dashboard.pipeline.map((item) => Number.parseInt(item.count, 10) || 0), 1); return <div key={stage.title}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-ink">{stage.title}</span><span className="text-muted">{stage.count} · {stage.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-elevated"><div className={`h-full rounded-full ${["bg-primary", "bg-info", "bg-success", "bg-warning"][index % 4]}`} style={{ width: `${Math.max(10, (count / max) * 100)}%` }} /></div></div>; })}</div></Card>
        <Card className="glass-card min-w-0 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="section-title">Recent activity</h2><p className="mt-1 text-sm text-muted">Latest updates from your workspace</p></div><Bell className="size-5 text-subtle" /></div><div className="grid gap-2.5 sm:grid-cols-2">{dashboard.activity.slice(0, 4).map((item, index) => <div key={item.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-white p-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-elevated text-muted">{index === 0 ? <Zap className="size-4" /> : index === 1 ? <CheckCircle2 className="size-4" /> : <Users className="size-4" />}</div><div className="min-w-0"><div className="text-sm leading-5 text-ink">{item.text}</div><div className="mt-1 text-xs text-muted">{item.age}</div></div></div>)}</div></Card>
      </section>
    </div>
  );
}
