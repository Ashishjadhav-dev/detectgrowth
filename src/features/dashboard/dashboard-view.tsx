import Link from "next/link";
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
import { Sparkline } from "@/components/charts/sparkline";
import { opportunities, signals } from "@/data/mock";
import {
  AvatarStack,
  DonutChart,
  MetricCard,
  PreviewCard,
  SectionHeader,
  SmallStat,
  SummaryPill,
} from "@/components/ui/patterns";

const watchlist = [
  { name: "Cursor", score: 92, delta: "+12" },
  { name: "Anthropic", score: 87, delta: "+11" },
  { name: "Rippling", score: 79, delta: "+8" },
  { name: "Mistral", score: 66, delta: "+9" },
];

const tasks = [
  ["Follow up with Databricks", "High", "Today"],
  ["Review 15 new signals", "Medium", "Today"],
  ["Call Sarah at Notion", "High", "Tomorrow"],
  ["Prepare Acme Corp proposal", "Medium", "Tomorrow"],
  ["Connect with new leads", "Low", "May 30"],
];

const insights = [
  "Stripe raised $4.5B Series I two hours ago",
  "13 companies entered your ICP yesterday",
  "28 marketing roles opened across target accounts",
];

const activity = [
  "You added 32 companies to AI Startup lists",
  "Sarah commented on Acme Corp",
  "You starred product-led growth signals",
  "Deal closed: NITRO - $120K",
];

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

const pipelineColumns = [
  { title: "New", count: "12", value: "$3.2M" },
  { title: "Qualified", count: "18", value: "$5.1M" },
  { title: "Proposal", count: "13", value: "$2.9M" },
  { title: "Negotiation", count: "6", value: "$1.3M" },
  { title: "Won", count: "8", value: "$840K" },
];

const intelligenceRows = [
  ["Databricks", "95", "+18"],
  ["Ramp", "93", "+14"],
  ["Notion", "91", "+13"],
  ["Vercel", "90", "+11"],
  ["Canoe", "86", "+9"],
];

export function DashboardView() {
  return (
    <div className="space-y-6">
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
            <MetricCard label="New opportunities" value="128" delta="+18.7%" note="vs last 7 days" icon={<Rocket className="size-4" />} />
            <MetricCard label="Companies surging" value="47" delta="+12.6%" note="vs last 7 days" icon={<TrendingUp className="size-4" />} />
            <MetricCard label="New signals" value="284" delta="+32.1%" note="vs last 7 days" icon={<Zap className="size-4" />} />
            <MetricCard label="People discovered" value="1,420" delta="+15.3%" note="vs last 7 days" icon={<Users className="size-4" />} />
            <MetricCard label="Pipeline value" value="$8.42M" delta="+21.6%" note="vs last 7 days" icon={<Target className="size-4" />} />
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
            {insights.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  {index === 0 ? <Flame className="size-4" /> : index === 1 ? <Compass className="size-4" /> : <ShieldAlert className="size-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{item}</div>
                  <div className="mt-1 text-xs text-muted">{index + 1}h ago</div>
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
                  <div className="text-4xl font-semibold tracking-tight text-ink">94</div>
                  <div className="flex items-center gap-2 text-sm text-success">
                    <TrendingUp className="size-4" />
                    +18.2% this month
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-xl flex-1 text-primary">
                    <Sparkline />
                    <div className="mt-2 grid grid-cols-7 text-[10px] text-subtle">
                      {["Aug 20", "Aug 21", "Aug 22", "Aug 23", "Aug 24", "Aug 25", "Aug 26"].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                  </div>
                  <div className="w-40 space-y-2">
                    <SummaryPill label="Top signal" value="Hiring surge" tone="success" />
                    <SummaryPill label="Momentum" value="+32%" tone="info" />
                    <SummaryPill label="Confidence" value="High" tone="warning" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Top signals" description="Recent buying intent and business change" />
          <div className="space-y-2">
            {signals.slice(0, 5).map((signal) => (
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
                  <div className="text-xs text-success">+{signal.impact}</div>
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
            {tasks.map(([label, urgency, due]) => (
              <label key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                <input type="checkbox" className="size-4 rounded border-border text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{label}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{urgency}</span>
                    <span>•</span>
                    <span>{due}</span>
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
                {opportunities.slice(0, 5).map((opportunity, index) => (
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
                    <td className="table-cell text-muted">{2_400 - index * 350}</td>
                    <td className="table-cell text-muted">{opportunity.signals[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Watchlist updates" description="AI startup accounts you are tracking" action={<Link className="text-sm font-medium text-primary" href="/lists">View watchlist</Link>} />
          <div className="space-y-3">
            {watchlist.map((item) => (
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
          <SectionHeader title="Pipeline overview" description="Projected pipeline in the current cycle" action={<Link className="text-sm font-medium text-primary" href="/opportunities/abc-fashion">View pipeline</Link>} />
          <DonutChart value="$8.42M" label="Total" sublabel="Pipeline value by stage and owner" />
          <div className="mt-5 grid gap-2">
            {pipelineColumns.map((column) => (
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
            {intelligenceRows.map(([name, score, delta]) => (
              <div key={name} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-8 place-items-center rounded-xl bg-primary-soft text-xs font-semibold text-primary">
                  {name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{name}</div>
                  <div className="text-xs text-muted">Signal strength and momentum</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">{score}</div>
                  <div className="text-xs text-success">{delta}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Recent activity" description="Collaborator updates and system events" />
          <div className="space-y-3">
            {activity.map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  {index === 0 ? <FolderHeart className="size-4" /> : index === 1 ? <CheckCircle2 className="size-4" /> : index === 2 ? <FileText className="size-4" /> : <CircleEllipsis className="size-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{item}</div>
                  <div className="mt-1 text-xs text-muted">Just now</div>
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
