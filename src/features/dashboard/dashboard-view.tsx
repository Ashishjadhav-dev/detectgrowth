"use client";
import { useSession } from "@/components/auth/session-provider";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
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
import { PageSkeleton } from "@/components/ui/page-skeleton";

type DateRange = "7" | "30" | "90";
const dateRangeLabels: Record<DateRange, string> = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" };

function TrendChart({ range }: { range: DateRange }) {
  const chartPaths: Record<DateRange, { area: string; line: string; labels: string[]; points: { x: number; y: number; score: number; change: string; signals: number }[] }> = {
    "7": { area: "M0 148 C70 140 100 116 155 124 S245 88 315 102 S410 62 480 78 S570 42 640 48 L640 190 L0 190 Z", line: "M0 148 C70 140 100 116 155 124 S245 88 315 102 S410 62 480 78 S570 42 640 48", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Today"], points: [{ x: 0, y: 148, score: 78, change: "+2.1%", signals: 4 }, { x: 128, y: 130, score: 80, change: "+2.8%", signals: 6 }, { x: 256, y: 112, score: 82, change: "+1.4%", signals: 8 }, { x: 384, y: 91, score: 84, change: "+3.2%", signals: 10 }, { x: 512, y: 67, score: 86, change: "+2.6%", signals: 12 }, { x: 640, y: 48, score: 87, change: "+4.1%", signals: 14 }] },
    "30": { area: "M0 150 C50 145 60 128 110 132 S160 120 205 126 S250 92 300 106 S345 95 390 96 S430 64 480 78 S530 54 570 58 S615 30 640 38 L640 190 L0 190 Z", line: "M0 150 C50 145 60 128 110 132 S160 120 205 126 S250 92 300 106 S345 95 390 96 S430 64 480 78 S530 54 570 58 S615 30 640 38", labels: ["Jun 01", "Jun 08", "Jun 15", "Jun 22", "Today"], points: [{ x: 0, y: 150, score: 72, change: "+1.8%", signals: 18 }, { x: 160, y: 124, score: 77, change: "+4.3%", signals: 24 }, { x: 320, y: 103, score: 81, change: "+5.1%", signals: 29 }, { x: 480, y: 77, score: 84, change: "+3.7%", signals: 31 }, { x: 640, y: 38, score: 87, change: "+6.2%", signals: 34 }] },
    "90": { area: "M0 164 C55 152 92 156 130 138 S190 148 238 118 S300 126 345 101 S412 110 458 72 S520 84 560 54 S610 58 640 28 L640 190 L0 190 Z", line: "M0 164 C55 152 92 156 130 138 S190 148 238 118 S300 126 345 101 S412 110 458 72 S520 84 560 54 S610 58 640 28", labels: ["Apr 01", "Apr 22", "May 13", "Jun 03", "Jun 24", "Today"], points: [{ x: 0, y: 164, score: 68, change: "+0.9%", signals: 42 }, { x: 128, y: 143, score: 72, change: "+2.2%", signals: 61 }, { x: 256, y: 122, score: 76, change: "+3.4%", signals: 79 }, { x: 384, y: 99, score: 80, change: "+4.6%", signals: 96 }, { x: 512, y: 71, score: 84, change: "+5.4%", signals: 121 }, { x: 640, y: 28, score: 87, change: "+7.8%", signals: 146 }] },
  };
  const chart = chartPaths[range];
  const [activePoint, setActivePoint] = useState<(typeof chart.points)[number] | null>(null);
  useEffect(() => { setActivePoint(null); }, [range]);
  const handleChartMove = (event: React.PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const chartX = Math.min(640, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 640));
    const nearestPoint = chart.points.reduce((nearest, point) => Math.abs(point.x - chartX) < Math.abs(nearest.x - chartX) ? point : nearest, chart.points[0]);
    setActivePoint(nearestPoint);
  };
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
        <path d={chart.area} fill="url(#growth-fill)" />
        <path d={chart.line} fill="none" stroke="#5b35e6" strokeLinecap="round" strokeWidth="3" />
        <rect x="0" y="0" width="640" height="190" fill="transparent" aria-label="Explore growth score trend" onPointerMove={handleChartMove} onPointerLeave={() => setActivePoint(null)} />
        {activePoint ? <line x1={activePoint.x} x2={activePoint.x} y1="10" y2="190" stroke="#5b35e6" strokeDasharray="4 5" strokeOpacity=".28" className="transition-all duration-150" /> : null}
        {chart.points.map((point) => <g key={`${point.x}-${point.y}`}><circle cx={point.x} cy={point.y} r="14" fill="transparent" tabIndex={0} aria-label={`${point.score} growth score on ${chart.labels[Math.round((point.x / 640) * (chart.labels.length - 1))]}`} onMouseEnter={() => setActivePoint(point)} onFocus={() => setActivePoint(point)} onBlur={() => setActivePoint(null)} onMouseLeave={() => setActivePoint(null)} /><circle cx={point.x} cy={point.y} r={activePoint?.x === point.x ? 6 : 4} fill="#fff" stroke="#5b35e6" strokeWidth={activePoint?.x === point.x ? 3 : 2} className="transition-all duration-150" /></g>)}
      </svg>
      {activePoint ? <div className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 -translate-y-[115%] rounded-xl border border-border bg-white px-3 py-2 shadow-[0_12px_30px_rgba(23,27,43,.16)] transition-[left,top] duration-100 ease-out" style={{ left: `${Math.min(88, Math.max(12, 10 + (activePoint.x / 640) * 80))}%`, top: `${Math.max(22, 10 + (activePoint.y / 190) * 72)}%` }}><div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">{chart.labels[Math.round((activePoint.x / 640) * (chart.labels.length - 1))]}</div><div className="mt-1 flex items-baseline justify-between gap-3"><span className="text-lg font-semibold text-ink">{activePoint.score}</span><span className="text-xs font-medium text-success">{activePoint.change}</span></div><div className="mt-1 text-[11px] text-muted">{activePoint.signals} signals detected</div></div> : null}
      <div className="absolute inset-x-10 bottom-2 flex justify-between text-[10px] text-subtle sm:inset-x-14">{chart.labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

function Kpi({ label, value, delta, icon, tone = "primary" }: { label: string; value: string; delta: string; icon: React.ReactNode; tone?: "primary" | "green" | "blue" | "amber" }) {
  const tones = { primary: "bg-primary-soft text-primary", green: "bg-emerald-50 text-success", blue: "bg-blue-50 text-info", amber: "bg-amber-50 text-warning" };
  return (
    <Card className="glass-card min-w-0 p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_36px_rgba(91,53,230,.09)]">
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
  const user = useSession();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>(demoDashboard.tasks.filter((task) => task.completed).map((task) => task.id));
  useEffect(() => { if (dashboard) setCompletedTasks(dashboard.tasks.filter((task) => task.completed).map((task) => task.id)); }, [dashboard]);

  const loadDashboard = () => {
    setLoading(true);
    const minimumAnimation = new Promise<void>((resolve) => window.setTimeout(resolve, 650));
    Promise.all([
      getDashboardData()
        .then((data) => { setDashboard(data); })
        .catch(() => { setDashboard(demoDashboard); }),
      minimumAnimation,
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    getDashboardData().then((data) => { if (!cancelled) setDashboard(data); }).catch(() => { if (!cancelled) setDashboard(demoDashboard); });
    const refreshTimer = window.setInterval(() => { if (!cancelled) loadDashboard(); }, 30_000);
    return () => { cancelled = true; window.clearInterval(refreshTimer); };
  }, []);

  const openTasks = useMemo(() => dashboard?.tasks.filter((task) => !completedTasks.includes(task.id)) ?? [], [completedTasks, dashboard]);
  if (!dashboard) return <PageSkeleton variant="dashboard" />;

  const summary = dashboard.summary;
  const selectedRange = dateRangeLabels[dateRange];

  const toggleTask = (id: string, checked: boolean) => {
    setCompletedTasks((current) => checked ? [...new Set([...current, id])] : current.filter((taskId) => taskId !== id));
    void updateDashboardTask(id, checked).catch(() => { setCompletedTasks((current) => checked ? current.filter((taskId) => taskId !== id) : [...current, id]); });
  };

  return (
    <div className="min-w-0 space-y-5 pb-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Growth overview</div>
          <h1 className="page-title mt-2">Hi {user?.name ?? "there"}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">A clear view of the accounts, signals, and follow-ups that need your attention today.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <div className="relative"><Button variant="secondary" size="sm" onClick={() => setDateMenuOpen((open) => !open)} aria-expanded={dateMenuOpen} aria-haspopup="listbox"><CalendarDays className="size-4" />{selectedRange}<ChevronDown className={`size-3.5 transition-transform duration-200 ${dateMenuOpen ? "rotate-180" : ""}`} /></Button>{dateMenuOpen ? <div className="absolute right-0 top-11 z-20 w-40 rounded-xl border border-border bg-white p-1.5 shadow-[0_16px_40px_rgba(23,27,43,.14)]" role="listbox" aria-label="Date range"><div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">Date range</div>{(Object.keys(dateRangeLabels) as DateRange[]).map((option) => <button type="button" key={option} role="option" aria-selected={dateRange === option} onClick={() => { setDateRange(option); setDateMenuOpen(false); }} className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${dateRange === option ? "bg-primary-soft text-primary" : "text-muted hover:bg-elevated hover:text-ink"}`}>{dateRangeLabels[option]}</button>)}</div> : null}</div>
          <Button variant="secondary" size="sm" onClick={loadDashboard} disabled={loading}><RefreshCw className={`size-4 transition-transform duration-200 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </section>


      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="New opportunities" value={summary.newOpportunities} delta={`${summary.growthDelta} vs last period`} icon={<Target className="size-4" />} />
        <Kpi label="Companies surging" value={summary.companiesSurging} delta="8% above average" icon={<TrendingUp className="size-4" />} tone="green" />
        <Kpi label="New signals" value={summary.newSignals} delta="12 high priority" icon={<Zap className="size-4" />} tone="amber" />
        <Kpi label="People discovered" value={summary.peopleDiscovered} delta="23 new this week" icon={<Users className="size-4" />} tone="blue" />
        <Kpi label="Pipeline value" value={summary.pipelineValue} delta="18% this month" icon={<CircleDollarSign className="size-4" />} tone="green" />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
        <Card className="glass-card min-w-0 p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(91,53,230,.08)]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="section-title">Growth score trend</h2><p className="mt-1 text-sm text-muted">Average score across tracked companies · {selectedRange.toLowerCase()}</p></div>
            <div className="text-right"><div className="text-2xl font-semibold text-ink">{summary.averageGrowthScore}</div><div className="text-xs font-medium text-success">{summary.growthDelta} vs prior period</div></div>
          </div>
          <TrendChart range={dateRange} />
          <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-elevated p-3"><div className="text-[11px] text-muted">Top signal</div><div className="mt-1 truncate text-sm font-semibold text-ink">{dashboard.signals[0]?.type ?? "—"}</div></div><div className="rounded-xl bg-elevated p-3"><div className="text-[11px] text-muted">Confidence</div><div className="mt-1 text-sm font-semibold text-ink">{dashboard.signals[0]?.confidence ?? 0}%</div></div><div className="rounded-xl bg-elevated p-3"><div className="text-[11px] text-muted">Active accounts</div><div className="mt-1 text-sm font-semibold text-ink">{summary.companiesSurging}</div></div></div>
        </Card>

        <Card className="glass-card min-w-0 p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(91,53,230,.08)]">
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
