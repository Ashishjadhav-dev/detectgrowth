"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, Clock3, FileText, Sparkles } from "lucide-react";
import { AICopilotDrawer } from "@/components/ai/ai-copilot-drawer";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getDashboardData, updateDashboardTask, type DashboardData } from "@/lib/api/dashboard";
import { demoDashboard } from "@/data/demo";

function Metric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: string }) {
  return <Card className="p-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p><p className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</p><p className="mt-1 truncate text-xs text-muted">{detail}</p></div><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span></div></Card>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border bg-elevated/40 p-4 text-center text-sm text-muted">{children}</div>;
}

export function DashboardView() {
  const user = useSession();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [resumeScore, setResumeScore] = useState(0);

  const load = () => { setLoading(true); getDashboardData().then(setDashboard).catch(() => setDashboard(demoDashboard)).finally(() => setLoading(false)); };
  useEffect(() => { load(); const refresh = () => load(); window.addEventListener("dashboard-refresh", refresh); try { const saved = window.sessionStorage.getItem("detectgrowth-ats-analysis"); if (saved) setResumeScore(Number(JSON.parse(saved).score ?? 0)); } catch { /* Keep the empty state. */ } return () => window.removeEventListener("dashboard-refresh", refresh); }, []);
  useEffect(() => { if (dashboard) setCompletedTasks(dashboard.tasks.filter((task) => task.completed).map((task) => task.id)); }, [dashboard]);
  if (!dashboard) return <PageSkeleton variant="dashboard" />;

  const summary = dashboard.summary;
  const openTasks = dashboard.tasks.filter((task) => !completedTasks.includes(task.id));
  const toggleTask = (id: string, completed: boolean) => { setCompletedTasks((current) => completed ? [...new Set([...current, id])] : current.filter((item) => item !== id)); void updateDashboardTask(id, completed).catch(() => {}); };

  return <div className="dashboard-compact mx-auto max-w-[1500px] space-y-4 pb-6">
    <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="page-title">Hi {user?.name ?? "Demo User"}</h1><p className="meta mt-1">Track your job search and resume readiness in one place.</p></div><div className="flex flex-wrap gap-2"><Link href="/resume/upload"><Button variant="secondary" size="sm"><FileText className="size-4" />Upload resume</Button></Link><AICopilotDrawer triggerLabel="Tailor for job description" /></div></section>

    <section className="grid gap-3 sm:grid-cols-2"><Metric label="Matching jobs" value={summary.newOpportunities || "0"} detail="New opportunities for you" icon={<BriefcaseBusiness className="size-5" />} tone="bg-primary-soft text-primary" /><Metric label="Resume ATS score" value={resumeScore ? resumeScore + "/100" : "—"} detail={resumeScore ? "Latest saved analysis" : "Upload a resume to analyze"} icon={<Sparkles className="size-5" />} tone="bg-sky-50 text-sky-600" /></section>

    <section className="grid gap-4 xl:grid-cols-2"><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Today</p><h2 className="section-title mt-1">Immediate action items</h2><p className="meta mt-1">Keep the next useful actions close at hand.</p></div><Badge>{openTasks.length} open</Badge></div><div className="mt-4 space-y-2">{dashboard.tasks.slice(0, 5).map((task) => { const completed = completedTasks.includes(task.id); return <label key={task.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${completed ? "border-emerald-100 bg-emerald-50/50" : "border-border hover:border-primary/30 hover:bg-elevated/30"}`}><input type="checkbox" checked={completed} onChange={(event) => toggleTask(task.id, event.target.checked)} className="size-4 shrink-0 rounded border-border text-primary" /><span className={`min-w-0 flex-1 truncate text-sm font-medium ${completed ? "text-muted line-through" : "text-ink"}`}>{task.label}</span><span className="flex shrink-0 items-center gap-1 text-[11px] text-muted"><Clock3 className="size-3" />{task.due} · {task.urgency}</span>{completed ? <Check className="size-4 shrink-0 text-emerald-600" /> : null}</label>; })}{!dashboard.tasks.length ? <EmptyState>No tasks yet. Add an application to start building your action list.</EmptyState> : null}</div><Link href="/applications" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">View application tasks <ArrowRight className="size-4" /></Link></Card><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Resume health</p><h2 className="section-title mt-1">ATS quick-check</h2><p className="meta mt-1">Your latest saved analysis.</p></div><Link href="/resume/analysis" className="text-sm font-semibold text-primary">Details</Link></div>{resumeScore ? <div className="mt-4 flex items-center gap-5"><div className="grid size-24 shrink-0 place-items-center rounded-full p-1" style={{ background: `conic-gradient(${resumeScore >= 80 ? "#5f6f52" : "#d09b3f"} ${resumeScore * 3.6}deg, #e8ebe5 0deg)` }}><div className="grid size-full place-items-center rounded-full bg-white text-center"><span className="text-2xl font-semibold">{resumeScore}</span><span className="-mt-1 text-[10px] text-muted">/ 100</span></div></div><div className="space-y-2 text-xs"><p><span className="text-muted">Formatting</span> <strong className="ml-3 text-emerald-700">88</strong></p><p><span className="text-muted">Keywords</span> <strong className="ml-3 text-amber-700">72</strong></p><p><span className="text-muted">Impact</span> <strong className="ml-3 text-amber-700">74</strong></p></div></div> : <EmptyState><FileText className="mx-auto mb-2 size-5 text-primary" />Upload and analyze a resume to see your ATS score.</EmptyState>}<Link href="/resume/analysis" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Open resume analysis <ArrowRight className="size-4" /></Link></Card></section>


  </div>;
}
