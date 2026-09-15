"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, ChevronDown, MapPin, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobListing, JobSource, JobsResponse } from "@/types/jobs";

const sourceOptions: Array<"All sources" | JobSource> = ["All sources", "Arbeitnow", "Airbnb", "Netflix"];
const workplaceOptions = ["All workplaces", "Remote", "Hybrid", "On-site"] as const;

function relativeDate(value: string | null) {
  if (!value) return "Recently posted";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function sourceClass(source: JobSource) {
  return source === "Airbnb" ? "bg-[#ffebe9] text-[#d65348]" : source === "Netflix" ? "bg-[#fff2d6] text-[#b26b00]" : "bg-primary-soft text-primary";
}

function JobCard({ job }: { job: JobListing }) {
  return (
    <article className="group rounded-2xl border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(91,53,230,.10)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-elevated text-sm font-bold text-ink" role={job.logoUrl ? "img" : undefined} aria-label={job.logoUrl ? `${job.company} logo` : undefined} style={job.logoUrl ? { backgroundImage: `url(${job.logoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
            {!job.logoUrl ? job.company.slice(0, 1) : null}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold leading-6 text-ink group-hover:text-primary">{job.title}</h2>
            <p className="mt-0.5 text-sm font-medium text-muted">{job.company}</p>
          </div>
        </div>
        <a href={job.url} target="_blank" rel="noreferrer" aria-label={`Open ${job.title}`} className="rounded-xl p-2 text-muted transition hover:bg-primary-soft hover:text-primary">
          <ArrowUpRight className="size-4" />
        </a>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{job.location || "Location not listed"}</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{relativeDate(job.postedAt)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className={job.workplace === "Remote" ? "bg-[#e8f8f1] text-[#168255]" : "bg-elevated text-muted"}>{job.workplace}</Badge>
        {job.department ? <Badge className="bg-elevated text-muted">{job.department}</Badge> : null}
        {job.employmentType ? <Badge className="bg-elevated text-muted">{job.employmentType}</Badge> : null}
      </div>
      {job.description ? <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{job.description}</p> : null}
      <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-4">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourceClass(job.source)}`}>{job.source}</span>
        <a href={job.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">View opening <ArrowUpRight className="ml-1 inline size-3.5" /></a>
      </div>
    </article>
  );
}

export function JobsView() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<(typeof sourceOptions)[number]>("All sources");
  const [workplaceFilter, setWorkplaceFilter] = useState<(typeof workplaceOptions)[number]>("All workplaces");
  const [sort, setSort] = useState("Newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = () => {
    setLoading(true);
    fetch("/api/jobs").then(async (response) => { if (!response.ok) throw new Error("Unable to load job feeds"); return response.json() as Promise<JobsResponse>; }).then((payload) => { setData(payload); setError(null); }).catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...(data?.jobs ?? [])].filter((job) => {
      const searchable = `${job.title} ${job.company} ${job.location} ${job.department} ${job.employmentType}`.toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (source === "All sources" || job.source === source) && (workplaceFilter === "All workplaces" || job.workplace === workplaceFilter);
    }).sort((a, b) => sort === "Company" ? a.company.localeCompare(b.company) : (new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime()));
  }, [data, query, sort, source, workplaceFilter]);

  const availableCount = Object.values(data?.sources ?? {}).filter((item) => item.ok).length;
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-[#111a2d] px-6 py-7 text-white shadow-[0_20px_60px_rgba(17,26,45,.16)] md:px-8 md:py-9">
      <div className="absolute -right-20 -top-28 size-72 rounded-full bg-[#7458ff]/25 blur-3xl" />
      <div className="relative max-w-2xl"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9adff]"><BriefcaseBusiness className="size-4" />Live job board</div><h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Find your next growth move.</h1><p className="mt-3 text-sm leading-6 text-white/60 md:text-base">A focused feed of active openings from curated public career boards. Search once, explore everywhere.</p></div>
      <div className="relative mt-7 flex max-w-3xl items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur"><Search className="ml-3 size-5 shrink-0 text-white/50" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, teams, locations…" className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/40" /><kbd className="hidden rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/45 sm:block">⌘ K</kbd></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-3"><Card className="glass-card p-4"><div className="text-xs font-medium text-muted">Active openings</div><div className="mt-2 text-2xl font-semibold text-ink">{loading ? "—" : filteredJobs.length.toLocaleString()}</div><div className="mt-1 text-xs text-muted">matching your filters</div></Card><Card className="glass-card p-4"><div className="text-xs font-medium text-muted">Career sources</div><div className="mt-2 text-2xl font-semibold text-ink">{loading ? "—" : `${availableCount}/3`}</div><div className="mt-1 text-xs text-muted">feeds available now</div></Card><Card className="glass-card p-4"><div className="text-xs font-medium text-muted">Last refreshed</div><div className="mt-2 text-2xl font-semibold text-ink">{data ? relativeDate(data.fetchedAt) : "—"}</div><div className="mt-1 text-xs text-muted">updates every 5 minutes</div></Card></section>

    <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-2"><SlidersHorizontal className="mr-1 size-4 text-muted" />{sourceOptions.map((item) => <button key={item} onClick={() => setSource(item)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${source === item ? "bg-primary text-white shadow-[0_8px_20px_rgba(91,53,230,.22)]" : "bg-white text-muted hover:bg-primary-soft hover:text-primary"}`}>{item}</button>)}</div><div className="flex flex-wrap gap-2"><label className="relative"><span className="sr-only">Workplace</span><select value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value as typeof workplaceFilter)} className="h-9 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50">{workplaceOptions.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-3 text-muted" /></label><label className="relative"><span className="sr-only">Sort jobs</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50"><option>Newest</option><option>Company</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-3 text-muted" /></label><Button variant="secondary" className="h-9 px-3 text-xs" onClick={loadJobs} disabled={loading}><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div></section>

    {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}. Try refreshing the feed.</div> : null}
    {data && Object.values(data.sources).some((item) => !item.ok) ? <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800"><Check className="mr-2 inline size-4" />Showing available openings. One or more public feeds could not be reached right now.</div> : null}
    {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-border bg-white" />)}</div> : filteredJobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <Card className="glass-card p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Search className="size-5" /></div><h2 className="mt-4 font-semibold text-ink">No openings found</h2><p className="mt-2 text-sm text-muted">Try a broader search or clear one of your filters.</p><button onClick={() => { setQuery(""); setSource("All sources"); setWorkplaceFilter("All workplaces"); }} className="mt-4 text-sm font-semibold text-primary">Clear filters</button></Card>}
  </div>;
}
