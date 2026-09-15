"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, ChevronDown, MapPin, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobListing, JobSource, JobsResponse } from "@/types/jobs";

const workplaceOptions = ["Any workplace", "Remote", "Hybrid", "On-site"] as const;

function friendlyLabel(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
  return source.startsWith("Greenhouse") ? "bg-[#ffebe9] text-[#d65348]" : source.startsWith("Lever") ? "bg-[#fff2d6] text-[#b26b00]" : "bg-primary-soft text-primary";
}

function JobCard({ job }: { job: JobListing }) {
  return (
    <article className="group min-w-0 rounded-2xl border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(91,53,230,.10)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-elevated text-sm font-bold text-ink" role={job.logoUrl ? "img" : undefined} aria-label={job.logoUrl ? `${job.company} logo` : undefined} style={job.logoUrl ? { backgroundImage: `url(${job.logoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
            {!job.logoUrl ? job.company.slice(0, 1) : null}
          </div>
          <div className="min-w-0">
          <h2 className="break-words font-semibold leading-6 text-ink group-hover:text-primary">{job.title}</h2>
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
        {job.department ? <Badge className="bg-elevated text-muted">{friendlyLabel(job.department)}</Badge> : null}
        {job.employmentType ? <Badge className="bg-elevated text-muted">{friendlyLabel(job.employmentType)}</Badge> : null}
        {job.tags.slice(0, 2).map((tag) => <Badge key={tag} className="bg-elevated text-muted">{friendlyLabel(tag)}</Badge>)}
      </div>
      {job.description ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted sm:line-clamp-2">{job.description}</p> : null}
      <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-4">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourceClass(job.source)}`}>{job.source}</span>
        <a href={job.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary transition hover:text-primary-hover">View opening <ArrowUpRight className="ml-1 inline size-3.5" /></a>
      </div>
    </article>
  );
}

export function JobsView() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [workplaceFilter, setWorkplaceFilter] = useState<(typeof workplaceOptions)[number]>("Any workplace");
  const [sort, setSort] = useState("Newest");
  const [greenhouseBoards, setGreenhouseBoards] = useState("airbnb");
  const [leverBoards, setLeverBoards] = useState("netflix");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ greenhouse: greenhouseBoards, lever: leverBoards });
    fetch(`/api/jobs?${params}`).then(async (response) => { if (!response.ok) throw new Error("Unable to load job feeds"); return response.json() as Promise<JobsResponse>; }).then((payload) => { setData(payload); setSource("All sources"); setError(null); }).catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false));
  }, [greenhouseBoards, leverBoards]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...(data?.jobs ?? [])].filter((job) => {
      const searchable = `${job.title} ${job.company} ${job.location} ${job.department} ${job.employmentType}`.toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (source === "All sources" || job.source === source) && (workplaceFilter === "Any workplace" || job.workplace === workplaceFilter);
    }).sort((a, b) => sort === "Company A–Z" ? a.company.localeCompare(b.company) : (new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime()));
  }, [data, query, sort, source, workplaceFilter]);

  const sourceOptions = ["All sources", ...Object.keys(data?.sources ?? {})];
  const availableCount = Object.values(data?.sources ?? {}).filter((item) => item.ok).length;
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-[#111a2d] px-6 py-7 text-white shadow-[0_20px_60px_rgba(17,26,45,.16)] md:px-8 md:py-9">
      <div className="absolute -right-20 -top-28 size-72 rounded-full bg-[#7458ff]/25 blur-3xl" />
      <div className="relative max-w-2xl"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9adff]"><BriefcaseBusiness className="size-4" />Live job board</div><h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Find your next growth move.</h1><p className="mt-3 text-sm leading-6 text-white/60 md:text-base">A focused feed of active openings from curated public career boards. Search once, explore everywhere.</p></div>
      <div className="relative mt-6 flex max-w-3xl items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur sm:mt-7 sm:gap-3"><Search className="ml-2 size-5 shrink-0 text-white/50 sm:ml-3" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search jobs" placeholder="Search by role, company, or location…" className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/40" />{query ? <button aria-label="Clear search" onClick={() => setQuery("")} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><X className="size-4" /></button> : null}<kbd className="hidden rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/45 sm:block">⌘ K</kbd></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-3"><Card className="glass-card p-4"><div className="text-xs font-medium text-muted">Active openings</div><div className="mt-2 text-2xl font-semibold text-ink">{loading ? "—" : filteredJobs.length.toLocaleString()}</div><div className="mt-1 text-xs text-muted">matching your filters</div></Card><Card className="glass-card p-4"><div className="text-xs font-medium text-muted">Career sources</div><div className="mt-2 text-2xl font-semibold text-ink">{loading ? "—" : `${availableCount}/3`}</div><div className="mt-1 text-xs text-muted">feeds available now</div></Card><Card className="glass-card p-4"><div className="text-xs font-medium text-muted">Last refreshed</div><div className="mt-2 text-2xl font-semibold text-ink">{data ? relativeDate(data.fetchedAt) : "—"}</div><div className="mt-1 text-xs text-muted">updates every 5 minutes</div></Card></section>

    <Card className="glass-card min-w-0 overflow-hidden p-4"><div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold text-ink"><BriefcaseBusiness className="size-4 shrink-0 text-primary" />Choose career boards</div><p className="mt-1 max-w-xl break-words text-xs leading-5 text-muted">Add company board IDs separated by commas. These are the last part of a public careers URL, such as <span className="font-medium text-ink">google</span> or <span className="font-medium text-ink">stripe</span>.</p></div><div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:min-w-0 lg:flex-1"><label className="min-w-0 text-xs font-medium text-muted">Greenhouse company IDs<Input value={greenhouseBoards} onChange={(event) => setGreenhouseBoards(event.target.value)} placeholder="airbnb, google" className="mt-1.5 h-9 min-w-0" /></label><label className="min-w-0 text-xs font-medium text-muted">Lever company IDs<Input value={leverBoards} onChange={(event) => setLeverBoards(event.target.value)} placeholder="netflix, stripe" className="mt-1.5 h-9 min-w-0" /></label></div><Button className="h-9 w-full shrink-0 lg:w-auto" onClick={loadJobs} disabled={loading}><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Update results</Button></div></Card>
    <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><SlidersHorizontal className="mr-1 size-4 shrink-0 text-muted" /><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Filter by source</span><div className="flex max-w-full flex-wrap gap-2">{sourceOptions.map((item) => <button key={item} onClick={() => setSource(item)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${source === item ? "bg-primary text-white shadow-[0_8px_20px_rgba(91,53,230,.22)]" : "bg-white text-muted hover:bg-primary-soft hover:text-primary"}`}>{item}</button>)}</div></div><p aria-live="polite" className="mt-2 text-xs text-muted">Showing {filteredJobs.length.toLocaleString()} of {(data?.jobs.length ?? 0).toLocaleString()} openings</p></div><div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><label className="relative"><span className="sr-only">Workplace</span><select aria-label="Filter by workplace" value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value as typeof workplaceFilter)} className="h-10 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50 sm:h-9 sm:w-auto"><option>Any workplace</option>{workplaceOptions.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3.5 size-3 text-muted sm:top-3" /></label><label className="relative"><span className="sr-only">Sort jobs</span><select aria-label="Sort jobs" value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50 sm:h-9 sm:w-auto"><option>Newest first</option><option>Company A–Z</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-3.5 size-3 text-muted sm:top-3" /></label><Button variant="secondary" className="col-span-2 h-10 px-3 text-xs sm:col-span-1 sm:h-9" onClick={loadJobs} disabled={loading}><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div></section>

    {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}. Try refreshing the feed.</div> : null}
    {data && Object.values(data.sources).some((item) => !item.ok) ? <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800"><Check className="mr-2 inline size-4" />Showing available openings. One or more public feeds could not be reached right now.</div> : null}
    {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-border bg-white" />)}</div> : filteredJobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <Card className="glass-card p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Search className="size-5" /></div><h2 className="mt-4 font-semibold text-ink">No openings found</h2><p className="mt-2 text-sm text-muted">Try a broader search or clear one of your filters.</p><button onClick={() => { setQuery(""); setSource("All sources"); setWorkplaceFilter("Any workplace"); }} className="mt-4 text-sm font-semibold text-primary">Clear filters</button></Card>}
  </div>;
}
