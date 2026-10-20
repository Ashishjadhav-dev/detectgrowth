"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getJobHuntSnapshot, recordApplication, scanJobMatches, type JobHuntSnapshot, type JobMatch } from "@/lib/api/job-hunt";
import type { JobListing, JobsResponse } from "@/types/jobs";

function resumeText() {
  try {
    const draft = JSON.parse(window.localStorage.getItem("detectgrowth-resume-draft") ?? "{}");
    return [draft.name, draft.headline, draft.summary, draft.experience, draft.education, draft.skills, draft.projects].filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function MatchRow({ match, applying, onApply }: { match: JobMatch; applying: boolean; onApply: (match: JobMatch) => void }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-ink">{match.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${match.score >= 80 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{match.score}% match</span></div><p className="mt-1 truncate text-xs text-muted">{match.company} · {match.location}</p><p className="mt-1 truncate text-[11px] text-muted">{match.matchedKeywords.slice(0, 4).join(" · ") || "Resume alignment detected"}</p></div><div className="flex shrink-0 items-center gap-2"><a href={match.url} target="_blank" rel="noreferrer" aria-label={`Review ${match.title}`} className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-primary"><ExternalLink className="size-4" /></a><Button size="sm" disabled={applying || match.status === "applied"} onClick={() => onApply(match)}>{match.status === "applied" ? <><Check className="size-4" />Applied</> : applying ? "Opening…" : "Review & apply"}</Button></div></div>;
}

export function JobHuntPanel() {
  const [snapshot, setSnapshot] = useState<JobHuntSnapshot>({ matches: [], applications: [], lastScanAt: null });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const scan = async () => {
    const text = resumeText();
    if (text.trim().length < 20) { setMessage("Add or create a resume before scanning for matched jobs."); return; }
    setScanning(true); setMessage("");
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load job openings.");
      const payload = await response.json() as JobsResponse;
      setSnapshot(await scanJobMatches(text, payload.jobs as JobListing[]));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Daily job scan failed."); }
    finally { setScanning(false); setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    getJobHuntSnapshot().then((data) => {
      if (!active) return;
      setSnapshot(data);
      setLoading(false);
      if (!data.lastScanAt || !isToday(data.lastScanAt)) void scan();
    }).catch(() => { if (active) { setLoading(false); setMessage("Unable to load your job matches."); } });
    return () => { active = false; };
  }, []);

  const appliedToday = useMemo(() => snapshot.applications.filter((application) => isToday(application.appliedAt)), [snapshot.applications]);
  const onApply = async (match: JobMatch) => {
    setApplying(match.id); setMessage("");
    try {
      await recordApplication(match.id);
      setSnapshot((current) => ({ ...current, matches: current.matches.map((item) => item.id === match.id ? { ...item, status: "applied" } : item), applications: [{ id: match.id, matchId: match.id, jobId: match.jobId, title: match.title, company: match.company, url: match.url, appliedAt: new Date().toISOString(), status: "applied" }, ...current.applications] }));
      window.open(match.url, "_blank", "noopener,noreferrer");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to record this application."); }
    finally { setApplying(null); }
  };

  return <section className="grid gap-4 xl:grid-cols-2"><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary"><Sparkles className="size-4" /></span><p className="eyebrow">Daily scan</p></div><h2 className="section-title mt-2">Jobs matched to your resume</h2><p className="meta mt-1">Fresh openings scored against your saved resume.</p></div><Button variant="ghost" size="sm" onClick={() => void scan()} disabled={scanning} aria-label="Scan for new jobs"><RefreshCw className={`size-4 ${scanning ? "animate-spin" : ""}`} /></Button></div>{loading || scanning ? <div className="mt-4 rounded-xl bg-elevated p-4 text-sm text-muted">{scanning ? "Scanning supported job sources…" : "Loading your matches…"}</div> : snapshot.matches.length ? <div className="mt-4 space-y-2">{snapshot.matches.slice(0, 4).map((match) => <MatchRow key={match.id} match={match} applying={applying === match.id} onApply={onApply} />)}</div> : <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">No aligned openings yet. Update your resume or scan again tomorrow.</div>}{message ? <p role="status" className="mt-3 text-xs text-muted">{message}</p> : null}<Link href="/jobs" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Browse all openings <ArrowUpRight className="size-4" /></Link></Card><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary"><BriefcaseBusiness className="size-4" /></span><p className="eyebrow">Application activity</p></div><h2 className="section-title mt-2">Applied today</h2><p className="meta mt-1">Jobs you chose to review and apply to.</p></div><Badge>{appliedToday.length}</Badge></div>{appliedToday.length ? <div className="mt-4 space-y-2">{appliedToday.slice(0, 5).map((application) => <a key={application.id} href={application.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 hover:border-primary/30"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{application.title}</p><p className="mt-1 truncate text-xs text-muted">{application.company}</p></div><Check className="size-4 shrink-0 text-emerald-600" /></a>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">No applications recorded today. Review a matched role to begin.</div>}<p className="mt-4 text-xs text-muted">Applications are recorded after you click Review & apply and open the official posting.</p></Card></section>;
}
