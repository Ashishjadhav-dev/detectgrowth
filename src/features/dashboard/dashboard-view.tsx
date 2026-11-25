"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, FileText, Handshake, Sparkles } from "lucide-react";
import { AICopilotDrawer } from "@/components/ai/ai-copilot-drawer";
import { JobHuntPanel } from "@/features/job-hunt/job-hunt-panel";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardTasks, updateDashboardTask, type DashboardTask } from "@/lib/api/dashboard";
import type { ResumeAnalysis } from "@/lib/resume-analysis";

function Metric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: string }) {
  return <Card className="p-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p><p className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</p><p className="mt-1 truncate text-xs text-muted">{detail}</p></div><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span></div></Card>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border bg-elevated/40 p-4 text-center text-sm text-muted">{children}</div>;
}

function ResumeHealthCard({ analysis }: { analysis: ResumeAnalysis | null }) {
  const score = analysis?.score ?? 0;
  const categories = analysis?.categories ?? [];
  const tone = score >= 80 ? "text-emerald-700" : score >= 60 ? "text-amber-700" : "text-red-700";
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Resume health</p><h2 className="section-title mt-1">ATS quick-check</h2><p className="meta mt-1">Your latest saved analysis.</p></div><div className="shrink-0 text-right"><p className={`text-3xl font-semibold tracking-tight ${tone}`}>{score || "—"}</p><p className="text-[11px] text-muted">/ 100 total score</p></div></div>{score ? <><div className="mt-4 flex items-center justify-between rounded-xl bg-elevated/40 px-3 py-2.5"><p className="text-sm font-medium text-ink">{score >= 80 ? "Ready for targeted applications" : "A few improvements can lift your score"}</p><span className={`text-xs font-semibold ${tone}`}>{score >= 80 ? "Strong" : "Needs attention"}</span></div><div className="mt-4 space-y-2.5">{categories.map((category) => <div key={category.label}><div className="mb-1 flex items-center justify-between text-[11px]"><span className="font-medium text-ink">{category.label}</span><span className="text-muted">{category.score}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-elevated"><div className={`h-full rounded-full ${category.score >= 75 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${category.score}%` }} /></div></div>)}</div><p className="mt-4 text-xs leading-5 text-muted">Improve keyword coverage and measurable impact before applying.</p></> : <EmptyState><FileText className="mx-auto mb-2 size-5 text-primary" />Upload and analyze a resume to see your ATS score.</EmptyState>}<Link href="/resume/analysis" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Open full analysis <ArrowRight className="size-4" /></Link></Card>;
}

export function DashboardView() {
  const user = useSession();
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [taskError, setTaskError] = useState("");

  const load = () => {
    setLoading(true);
    setTaskError("");
    getDashboardTasks().then((items) => {
      setTasks(items);
      setCompletedTasks(items.filter((task) => task.completed).map((task) => task.id));
    }).catch(() => setTaskError("Unable to load tasks. Try refreshing your workspace.")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); const refresh = () => load(); window.addEventListener("dashboard-refresh", refresh); try { const saved = window.sessionStorage.getItem("detectgrowth-ats-analysis"); if (saved) { const value = JSON.parse(saved); if (typeof value.score === "number" && Array.isArray(value.categories)) setAnalysis(value); } } catch { /* Keep the empty state. */ } return () => window.removeEventListener("dashboard-refresh", refresh); }, []);

  const resumeScore = analysis?.score;
  const openTasks = tasks.filter((task) => !completedTasks.includes(task.id));
  const toggleTask = async (id: string, completed: boolean) => {
    setTaskError("");
    try {
      await updateDashboardTask(id, completed);
      setCompletedTasks((current) => completed ? [...new Set([...current, id])] : current.filter((item) => item !== id));
    } catch {
      setTaskError("Unable to update the task. Please try again.");
    }
  };

  return <div className="dashboard-compact mx-auto max-w-[1500px] space-y-4 pb-6">
    <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="page-title">Hi {user?.name ?? "Demo User"}</h1><p className="meta mt-1">Find business prospects, manage your job search, and track resume readiness.</p></div><div className="flex flex-wrap gap-2"><Link href="/resume/upload"><Button variant="secondary" size="sm"><FileText className="size-4" />Upload resume</Button></Link><AICopilotDrawer triggerLabel="Tailor for job description" /></div></section>

    <section className="grid gap-3 sm:grid-cols-2"><Link href="/leads" className="rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><Card className="flex h-full items-center gap-3 p-4 hover:border-primary/40"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Handshake className="size-5" /></span><div><h2 className="font-semibold text-ink">Discover business leads</h2><p className="mt-1 text-sm text-muted">Find local prospects and build your shortlist.</p></div></Card></Link><Metric label="Resume ATS score" value={resumeScore !== undefined ? resumeScore + "/100" : "—"} detail={resumeScore !== undefined ? "Latest saved analysis" : "Upload a resume to analyze"} icon={<Sparkles className="size-5" />} tone="bg-sky-50 text-sky-600" /></section>

    <JobHuntPanel />

    <section className="grid gap-4 xl:grid-cols-2"><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Today</p><h2 className="section-title mt-1">Immediate action items</h2><p className="meta mt-1">Keep the next useful actions close at hand.</p></div><Badge>{openTasks.length} open</Badge></div><div className="mt-4 space-y-2">{taskError && <p role="alert" className="text-sm text-danger">{taskError}</p>}{tasks.slice(0, 5).map((task) => { const completed = completedTasks.includes(task.id); return <label key={task.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${completed ? "border-emerald-100 bg-emerald-50/50" : "border-border hover:border-primary/30 hover:bg-elevated/30"}`}><input type="checkbox" checked={completed} onChange={(event) => toggleTask(task.id, event.target.checked)} className="size-4 shrink-0 rounded border-border text-primary" /><span className={`min-w-0 flex-1 truncate text-sm font-medium ${completed ? "text-muted line-through" : "text-ink"}`}>{task.label}</span><span className="flex shrink-0 items-center gap-1 text-[11px] text-muted"><Clock3 className="size-3" />{task.due} · {task.urgency}</span>{completed ? <Check className="size-4 shrink-0 text-emerald-600" /> : null}</label>; })}{loading ? <p role="status" className="text-sm text-muted">Loading tasks…</p> : !tasks.length && !taskError ? <EmptyState>No tasks yet.</EmptyState> : null}</div><Link href="/applications" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">View application tasks <ArrowRight className="size-4" /></Link></Card><ResumeHealthCard analysis={analysis} /></section>


  </div>;
}
