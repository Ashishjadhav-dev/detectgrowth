"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleEllipsis,
  Compass,
  FileText,
  Flame,
  FolderHeart,
  Rocket,
  ShieldAlert,
  Sparkles,
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
import {
  AvatarStack,
  DonutChart,
  MetricCard,
  PreviewCard,
  SectionHeader,
  SmallStat,
  SummaryPill,
} from "@/components/ui/patterns";

const moduleCards = [
  {
    eyebrow: "01. Authentication",
    title: "Login, SSO, 2FA, recovery",
    description: "Production-grade auth states with session expiry, invite flows, locked accounts, and workspace handoff.",
    bullets: ["Forgot password and reset-password states", "SSO providers: Google, Microsoft, Okta", "Clean mobile-first forms and error handling"],
    footer: "Ready for auth and onboarding screens",
  },
  {
    eyebrow: "02. Onboarding",
    title: "Role, goals, ICP, sources",
    description: "Guided setup for role selection, goals, signals, integrations, and import steps.",
    bullets: ["Step progress with continuation states", "Data-source connection and import surfaces", "Success state that routes to dashboard"],
    footer: "Matches the onboarding wireframes",
  },
  {
    eyebrow: "03. Discovery",
    title: "Search and results workflow",
    description: "Search by company or person with filters, saved views, bulk actions, and rich result rows.",
    bullets: ["Table and card result modes", "Filter drawer, chips, and query summary", "Company and person discovery variants"],
    footer: "Consistent with discover/search layouts",
  },
  {
    eyebrow: "04. Company 360",
    title: "Company overview and signals",
    description: "A single account workspace with growth history, signals, people, notes, and recommended actions.",
    bullets: ["Tab-based overview, signals, people, and notes", "Growth charts and signal evidence", "Decision-maker and fit panels"],
    footer: "Built for the 360 detail experience",
  },
  {
    eyebrow: "05. People 360",
    title: "Decision maker profiles",
    description: "Contact intelligence with role, engagement, and outreach actions.",
    bullets: ["Engagement, activity, and contact details", "Meeting scheduler and next-step widgets", "Signals associated with the person"],
    footer: "Matches the person detail wireframe",
  },
  {
    eyebrow: "06. Workflows",
    title: "Automation and execution",
    description: "Workflow listing, builder nodes, validation, publishing, and run history.",
    bullets: ["Canvas-style builder preview", "Execution history and branching", "Version and test states"],
    footer: "Ready for a more detailed automation surface",
  },
];

export function DashboardView() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = () => {
      getDashboardData()
        .then((data) => {
          if (!cancelled) {
            setDashboard(data);
            setDashboardError(null);
          }
        })
        .catch((error: Error) => {
          if (!cancelled) setDashboardError(error.message);
        });
    };
    loadDashboard();
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
    const events = new EventSource(`${apiBase}/api/v1/events`, { withCredentials: true });
    events.addEventListener("dashboard", loadDashboard);
    const refreshTimer = window.setInterval(loadDashboard, 30_000);
    return () => {
      cancelled = true;
      events.close();
      window.clearInterval(refreshTimer);
    };
  }, []);

  const dashboardSummary = dashboard?.summary;
  const metricDelta = dashboardSummary?.growthDelta ?? "—";
  const visibleInsights = dashboard?.insights ?? [];
  const visibleTasks = dashboard?.tasks ?? [];
  const visibleActivity = dashboard?.activity ?? [];
  const visibleSignals = dashboard?.signals ?? [];
  const visibleOpportunities = dashboard?.opportunities ?? [];
  const visibleWatchlist = dashboard?.watchlist ?? [];
  const visiblePipeline = dashboard?.pipeline ?? [];
  const visibleTrending = dashboard?.trending ?? [];

  return (
    <div className="space-y-6">
      {dashboardError ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Dashboard API unavailable. Start the Go API and try again.</div> : null}
      <section className="grid gap-4 xl:grid-cols-[1.35fr_.95fr]">
        <Card className="glass-card overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Home Dashboard</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Your growth command center</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                A wireframe-faithful overview of opportunities, signals, tasks, pipeline, and the product modules underneath.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <CalendarDays className="size-4" />
                Last 30 days
              </Button>
              <Button size="sm">
                <Sparkles className="size-4" />
                Create report
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="New opportunities" value={dashboardSummary?.newOpportunities ?? "—"} delta={metricDelta} note="vs last 7 days" icon={<Rocket className="size-4" />} />
            <MetricCard label="Companies surging" value={dashboardSummary?.companiesSurging ?? "—"} delta={metricDelta} note="vs last 7 days" icon={<TrendingUp className="size-4" />} />
            <MetricCard label="New signals" value={dashboardSummary?.newSignals ?? "—"} delta={metricDelta} note="vs last 7 days" icon={<Zap className="size-4" />} />
            <MetricCard label="People discovered" value={dashboardSummary?.peopleDiscovered ?? "—"} delta={metricDelta} note="vs last 7 days" icon={<Users className="size-4" />} />
            <MetricCard label="Pipeline value" value={dashboardSummary?.pipelineValue ?? "—"} delta={metricDelta} note="vs last 7 days" icon={<Target className="size-4" />} />
          </div>
        </Card>

        <Card className="glass-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Today&apos;s insights</div>
              <h2 className="mt-2 text-lg font-semibold text-ink">What changed since yesterday</h2>
            </div>
            <Bell className="size-5 text-subtle" />
          </div>
          <div className="mt-4 space-y-3">
            {visibleInsights.map((item, index) => (
              <div key={item.text} className="flex gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  {index === 0 ? <Flame className="size-4" /> : index === 1 ? <Compass className="size-4" /> : <ShieldAlert className="size-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{item.text}</div>
                  <div className="mt-1 text-xs text-muted">{item.age}</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="mt-3 w-full justify-between">
            View all insights
            <ChevronRight className="size-4" />
          </Button>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_.9fr_.8fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Growth score trend" description="Average growth score of tracked companies" />
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted">Average growth score</div>
              <Button variant="secondary" size="sm">
                Last 30 days
              </Button>
            </div>
            <div className="mt-3 h-64 rounded-2xl bg-[linear-gradient(180deg,rgba(91,53,230,.06),rgba(91,53,230,0))] p-4">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-2">
                <div className="text-4xl font-semibold tracking-tight text-ink">{dashboardSummary?.averageGrowthScore ?? "—"}</div>
                  <div className="flex items-center gap-2 text-sm text-success">
                    <TrendingUp className="size-4" />
                    {dashboardSummary?.growthDelta ?? "—"} this month
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-xl flex-1 text-primary">
                    <div className="grid h-28 place-items-center rounded-xl border border-dashed border-border text-center text-xs text-muted">No historical score data yet.<br />The API will populate this after scores are recorded over time.</div>
                  </div>
                  <div className="w-40 space-y-2">
                    <SummaryPill label="Top signal" value={visibleSignals[0]?.type ?? "—"} tone="success" />
                    <SummaryPill label="Momentum" value={metricDelta} tone="info" />
                    <SummaryPill label="Confidence" value={visibleSignals[0] ? `${visibleSignals[0].confidence}%` : "—"} tone="warning" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Top signals" description="Recent buying intent and business change" />
          <div className="space-y-2">
            {visibleSignals.map((signal) => (
              <div key={signal.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Zap className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{signal.type}</div>
                  <div className="truncate text-xs text-muted">{signal.company}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">{signal.confidence}%</div>
                  <div className="text-xs text-success">{signal.impact} impact</div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="mt-3 w-full justify-between">
            View all signals
            <ChevronRight className="size-4" />
          </Button>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="My tasks" description="Follow-ups and reviews for today" />
          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <label key={task.label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                <input
                  type="checkbox"
                  defaultChecked={task.completed}
                  onChange={(event) => {
                    if (!task.id.startsWith("preview-")) void updateDashboardTask(task.id, event.target.checked);
                  }}
                  className="size-4 rounded border-border text-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{task.label}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{task.urgency}</span>
                    <span>•</span>
                    <span>{task.due}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <Button variant="ghost" className="mt-3 w-full justify-between">
            View all tasks
            <ChevronRight className="size-4" />
          </Button>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr_.95fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Top opportunities" description="Companies with the strongest fit and signals" action={<Link className="text-sm font-medium text-primary" href="/discover">View all</Link>} />
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[700px] border-collapse">
              <thead className="bg-elevated text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                <tr>
                  <th className="table-cell">Company</th>
                  <th className="table-cell">Score</th>
                  <th className="table-cell">Employees</th>
                  <th className="table-cell">Primary signal</th>
                </tr>
              </thead>
              <tbody>
                {visibleOpportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="border-t border-border/80 transition hover:bg-elevated/60">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-xs font-semibold text-primary">
                          {opportunity.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-ink">{opportunity.company}</div>
                          <div className="text-xs text-muted">{opportunity.industry}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <Score value={opportunity.score} compact />
                    </td>
                    <td className="table-cell text-muted">{opportunity.employees}</td>
                    <td className="table-cell text-muted">{opportunity.signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Watchlist updates" description="AI startup accounts you are tracking" action={<Link className="text-sm font-medium text-primary" href="/lists">View watchlist</Link>} />
          <div className="space-y-3">
            {visibleWatchlist.map((item) => (
              <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                <AvatarStack names={[item.name, "Growth Team"]} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{item.name}</div>
                  <div className="text-xs text-muted">Growth score trend</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">{item.score}</div>
                  <div className="text-xs font-medium text-success">{item.delta}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Pipeline overview" description="Projected pipeline in the current cycle" action={<Link className="text-sm font-medium text-primary" href="/opportunities">View pipeline</Link>} />
          <DonutChart value={dashboardSummary?.pipelineValue ?? "—"} label="Total" sublabel="Pipeline value by stage and owner" segments={visiblePipeline.map((column, index) => ({ label: column.title, value: Number.parseInt(column.count, 10) || 0, color: ["#5b35e6", "#7c5cff", "#2f6fed", "#18a66b", "#f59e0b"][index % 5] }))} />
          <div className="mt-5 grid gap-2">
            {visiblePipeline.map((column) => (
              <div key={column.title} className="flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-ink">{column.title}</div>
                  <div className="text-xs text-muted">{column.count} opportunities</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">{column.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Trending companies" description="Signals are clustering around these accounts" action={<Link className="text-sm font-medium text-primary" href="/discover">View all</Link>} />
          <div className="space-y-2">
            {visibleTrending.map((item) => (
              <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-8 place-items-center rounded-xl bg-primary-soft text-xs font-semibold text-primary">
                  {item.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{item.name}</div>
                  <div className="text-xs text-muted">Signal strength and momentum</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">{item.score}</div>
                  <div className="text-xs text-success">{item.delta}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Recent activity" description="Collaborator updates and system events" />
          <div className="space-y-3">
            {visibleActivity.map((item, index) => (
              <div key={item.text} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  {index === 0 ? <FolderHeart className="size-4" /> : index === 1 ? <CheckCircle2 className="size-4" /> : index === 2 ? <FileText className="size-4" /> : <CircleEllipsis className="size-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{item.text}</div>
                  <div className="mt-1 text-xs text-muted">{item.age}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Product surface map"
          description="The wireframe becomes clearer when the supporting modules share a single visual language."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((card) => (
            <PreviewCard key={card.eyebrow} {...card} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.9fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Board states" description="Design system coverage that should exist in every major module" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SmallStat label="Loading" value="Ready" change="Skeletons defined" />
            <SmallStat label="Empty" value="Ready" change="No-results states" />
            <SmallStat label="Error" value="Ready" change="Inline and page errors" />
            <SmallStat label="Permission" value="Ready" change="RBAC states included" />
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Strong defaults" description="The shell now supports the main wireframe patterns without custom one-off UI." />
          <div className="grid gap-2">
            {[
              "Global search and command palette entry point",
              "Dark sidebar with grouped navigation",
              "Metrics, charts, tables, and actionable cards",
              "Auth/onboarding routes can render without the shell",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 text-sm text-ink">
                <CheckCircle2 className="size-4 text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-emerald-50 text-success">Responsive</Badge>
            <Badge className="bg-blue-50 text-info">Accessible</Badge>
            <Badge className="bg-amber-50 text-warning">Composable</Badge>
            <Badge className="bg-primary-soft text-primary">Wireframe-aligned</Badge>
          </div>
        </Card>
      </section>
    </div>
  );
}
