"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BriefcaseBusiness, LoaderCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { JobListing, JobsResponse } from "@/types/jobs";

function words(value: string) {
  return new Set(value.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").split(/\s+/).filter((word) => word.length > 2));
}

function matchScore(resumeText: string, job: JobListing) {
  const resumeWords = words(resumeText);
  const jobWords = words(`${job.title} ${job.department} ${job.tags.join(" ")} ${job.description}`);
  const matches = [...jobWords].filter((word) => resumeWords.has(word));
  return { score: Math.min(99, Math.max(35, Math.round(35 + (matches.length / Math.max(jobWords.size, 1)) * 180))), matches: matches.slice(0, 5) };
}

export function ResumeJobMatches({ resumeText, targetRole }: { resumeText: string; targetRole: string }) {
  const jobsQuery = useQuery<JobListing[], Error>({
    queryKey: ["resume-job-matches", targetRole],
    queryFn: async () => {
    const query = targetRole && targetRole !== "Professional role" ? `?search=${encodeURIComponent(targetRole)}` : "";
      const response = await fetch(`/api/jobs${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load current openings.");
      const payload = await response.json() as JobsResponse;
      return payload.jobs;
    },
    placeholderData: (previous) => previous,
  });
  const loading = jobsQuery.isLoading || jobsQuery.isFetching;
  const error = jobsQuery.error?.message ?? "";
  const load = useCallback(() => { void jobsQuery.refetch(); }, [jobsQuery]);
  const ranked = useMemo(() => (jobsQuery.data ?? []).map((job) => ({ job, ...matchScore(resumeText, job) })).sort((left, right) => right.score - left.score).slice(0, 5), [jobsQuery.data, resumeText]);

  return <Card className="border-primary/15 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><BriefcaseBusiness className="size-4" /></span><div><Badge>Live openings</Badge><h2 className="section-title mt-2">Roles that fit this resume</h2></div></div><p className="meta mt-2">Ranked from the public job feeds using <span className="font-medium text-ink">{targetRole}</span> and your extracted skills.</p></div><Button variant="ghost" size="sm" onClick={load} disabled={loading} aria-label="Refresh matched openings"><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /></Button></div>
    {loading ? <div className="mt-5 flex items-center gap-2 rounded-xl bg-elevated p-4 text-sm text-muted"><LoaderCircle className="size-4 animate-spin text-primary" />Searching current public job feeds…</div> : error ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error} <button className="ml-1 font-semibold underline" onClick={load}>Try again</button></div> : ranked.length ? <div className="mt-5 space-y-3">{ranked.map(({ job, score, matches }) => <div key={job.id} className="rounded-xl border border-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink">{job.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${score >= 75 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{score}% fit</span></div><p className="mt-1 text-sm text-muted">{job.company} · {job.location || "Location not listed"} · {job.source}</p><div className="mt-2 flex flex-wrap gap-1.5">{matches.length ? matches.map((match) => <span key={match} className="rounded-full bg-elevated px-2 py-1 text-[10px] text-muted">{match}</span>) : <span className="text-xs text-muted">Role alignment detected</span>}</div></div><a href={job.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">View opening <ArrowUpRight className="size-4" /></a></div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted">No current roles matched this title. Try adding a clearer target role to the resume headline.</div>}
  </Card>;
}
