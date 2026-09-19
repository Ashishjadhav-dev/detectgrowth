"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, ChevronDown, MapPin, RefreshCw, Search, Settings2, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveJob } from "@/components/jobs/save-job";
import { Dialog } from "@/components/ui/dialog";
import { JobsToolbar, type Workplace } from "@/components/jobs/jobs-toolbar";
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

function sourceClass(_source: JobSource) {
  return "border border-border bg-elevated text-muted";
}

function companyDomain(company: string) {
  return `${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
}

function CompanyLogo({ job, className }: { job: JobListing; className: string }) {
  const fallbackUrl = `https://www.google.com/s2/favicons?domain=${companyDomain(job.company)}&sz=128`;
  const [logoUrl, setLogoUrl] = useState(job.logoUrl || fallbackUrl);
  const [showImage, setShowImage] = useState(true);

  return <div className={`grid shrink-0 place-items-center rounded-2xl bg-elevated text-sm font-bold text-ink ${className}`} role={showImage ? "img" : undefined} aria-label={showImage ? `${job.company} logo` : undefined}>
    {showImage ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className="size-full rounded-[inherit] object-contain p-2" onError={() => { if (job.logoUrl && logoUrl !== fallbackUrl) setLogoUrl(fallbackUrl); else setShowImage(false); }} />
    ) : job.company.slice(0, 1)}
  </div>;
}

function JobCard({ job }: { job: JobListing }) {
  const metadataTags = [...new Map([job.workplace, job.department, job.employmentType, ...job.tags].filter(Boolean).map((tag) => [tag.toLowerCase(), friendlyLabel(tag)])).values()].slice(0, 4);
  return (
    <article className="group min-w-0 rounded-2xl border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(91,53,230,.10)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo job={job} className="size-11" />
          <div className="min-w-0">
          <h2 className="break-words font-semibold leading-6 text-ink group-hover:text-primary">{job.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-muted">{job.company}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceClass(job.source)}`}>{job.source}</span></div>
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
        {metadataTags.map((tag) => <Badge key={tag} className={"border border-border bg-white text-muted"}>{tag}</Badge>)}
      </div>
      {job.description ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted sm:line-clamp-2">{job.description}</p> : null}
      <div className="mt-5 flex items-center justify-end pt-1">
        <a href={job.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary transition hover:text-primary-hover">View opening <ArrowUpRight className="ml-1 inline size-3.5" /></a>
      </div>
    </article>
  );
}

function JobListItem({ job, selected, onSelect }: { job: JobListing; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-primary/40 bg-primary-soft/45 shadow-[0_8px_22px_rgba(91,53,230,.08)]" : "border-border bg-white hover:border-primary/25 hover:bg-elevated/50"}`} aria-pressed={selected}>
    <div className="flex items-start gap-3"><CompanyLogo job={job} className="size-10 rounded-xl" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-ink">{job.title}</div><div className="mt-1 truncate text-xs font-medium text-muted">{job.company}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted"><span className="inline-flex items-center gap-1"><MapPin className="size-3" />{job.location || "Location not listed"}</span><span>{relativeDate(job.postedAt)}</span></div></div><ArrowUpRight className={`size-4 shrink-0 ${selected ? "text-primary" : "text-subtle"}`} /></div>
    <div className="mt-3 flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceClass(job.source)}`}>{job.source}</span><span className="text-[11px] font-medium text-muted">{job.workplace}</span></div>
  </button>;
}

function JobDetail({ job }: { job: JobListing }) {
  const metadataTags = [...new Map([job.workplace, job.department, job.employmentType, ...job.tags].filter(Boolean).map((tag) => [tag.toLowerCase(), friendlyLabel(tag)])).values()].slice(0, 6);
  return <Card className="glass-card overflow-hidden"><div className="border-b border-border/80 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><CompanyLogo job={job} className="size-12" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${sourceClass(job.source)}`}>{job.source}</span><span className="text-xs text-muted">{relativeDate(job.postedAt)}</span></div><h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">{job.title}</h2><p className="mt-1 text-sm font-medium text-muted">{job.company}</p></div></div><div className="flex w-full gap-2 sm:w-auto"><SaveJob id={job.id} title={job.title} /><Button asChild size="sm" className="flex-1 sm:flex-none"><a href={job.url} target="_blank" rel="noreferrer">Apply now <ArrowUpRight className="size-4" /></a></Button></div></div><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{job.location || "Location not listed"}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Posted {relativeDate(job.postedAt).toLowerCase()}</span></div><div className="mt-4 flex flex-wrap gap-2">{metadataTags.map((tag) => <Badge key={tag} className={"border border-border bg-white text-muted"}>{tag}</Badge>)}</div></div><div className="p-5 sm:p-6"><h3 className="text-sm font-semibold text-ink">About this role</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{job.description || "No description was provided for this opening."}</p><a href={job.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover">View full posting <ArrowUpRight className="size-4" /></a></div></Card>;
}

function JobCardSkeleton() {
  return <Card className="min-w-0 p-4" aria-hidden="true"><div className="flex items-start gap-3"><Skeleton className="size-10 shrink-0 rounded-xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-2/5" /><div className="flex gap-3 pt-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-16" /></div></div><Skeleton className="size-4 rounded" /></div><div className="mt-3 flex items-center justify-between"><Skeleton className="h-4 w-20 rounded-full" /><Skeleton className="h-3 w-16" /></div></Card>;
}

function JobDetailSkeleton() {
  return <Card className="glass-card overflow-hidden" aria-hidden="true"><div className="border-b border-border/80 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><Skeleton className="size-12 shrink-0 rounded-2xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-24 rounded-full" /><Skeleton className="h-6 w-4/5" /><Skeleton className="h-4 w-2/5" /></div></div><div className="mt-5 flex gap-4"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3.5 w-24" /></div><div className="mt-4 flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div></div><div className="space-y-3 p-5 sm:p-6"><Skeleton className="h-4 w-28" /><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-11/12" /><Skeleton className="h-3.5 w-4/5" /><Skeleton className="mt-3 h-4 w-28" /></div></Card>;
}

function JobsLoadingSkeleton() {
  return <div className="grid min-h-0 gap-5 lg:h-full lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)] lg:items-start" aria-label="Loading job listings"><div className="min-w-0 space-y-3"> <div className="flex items-center justify-between px-1 py-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-20" /></div>{[1, 2, 3, 4, 5, 6].map((item) => <JobCardSkeleton key={item} />)}</div><div className="hidden min-w-0 lg:block lg:pt-14"><JobDetailSkeleton /></div></div>;
}

export function JobsView() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const media = window.matchMedia("(max-width: 1023px)"); const update = () => setIsMobile(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const [query, setQuery] = useState("accenture");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [source, setSource] = useState("All sources");
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [workplaceFilter, setWorkplaceFilter] = useState<Workplace>("Any workplace");
  const [sort, setSort] = useState("Newest");
  const [greenhouseBoards, setGreenhouseBoards] = useState("airbnb");
  const [leverBoards, setLeverBoards] = useState("netflix");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ greenhouse: greenhouseBoards, lever: leverBoards, search: query.trim() });
    fetch(`/api/jobs?${params}`).then(async (response) => { if (!response.ok) throw new Error("Unable to load job feeds"); return response.json() as Promise<JobsResponse>; }).then((payload) => { setData(payload); setSelectedSources([]); setError(null); }).catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false));
  }, [greenhouseBoards, leverBoards, query]);

  useEffect(() => { const timer = window.setTimeout(loadJobs, 350); return () => window.clearTimeout(timer); }, [loadJobs]);

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
      const searchable = `${job.title} ${job.company} ${job.location} ${job.department} ${job.employmentType} ${job.source}`.toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (!selectedSources.length || selectedSources.includes(job.source)) && (workplaceFilter === "Any workplace" || job.workplace === workplaceFilter);
    }).sort((a, b) => sort === "Company A–Z" ? a.company.localeCompare(b.company) : (new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime()));
  }, [data, query, selectedSources, sort, workplaceFilter]);

  const sourceOptions = ["All sources", ...Object.keys(data?.sources ?? {})];
  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0];
  return <div className="-mx-4 -my-4 flex min-h-[calc(100vh-4rem)] flex-col bg-white md:-mx-6 lg:-mx-7 lg:h-[calc(100vh-4.25rem)] lg:overflow-hidden">
    <JobsToolbar query={query} setQuery={setQuery} searchRef={searchRef} sourceOptions={sourceOptions} selectedSources={selectedSources} setSelectedSources={setSelectedSources} workplaceFilter={workplaceFilter} setWorkplaceFilter={setWorkplaceFilter} sort={sort} setSort={setSort} greenhouseBoards={greenhouseBoards} setGreenhouseBoards={setGreenhouseBoards} leverBoards={leverBoards} setLeverBoards={setLeverBoards} loading={loading} loadJobs={loadJobs} resultCount={filteredJobs.length} totalCount={data?.jobs.length ?? 0} />
    {error ? <div className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 md:mx-6 lg:mx-7">{error}. Try refreshing the feed.</div> : null}
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:px-6 lg:overflow-hidden lg:px-7">
    {loading ? <JobsLoadingSkeleton /> : filteredJobs.length ? <>
      <div className="lg:hidden"><Dialog open={isMobile && Boolean(selectedJobId && selectedJob)} title="Job details" onClose={() => setSelectedJobId(null)}>{selectedJob ? <JobDetail job={selectedJob} /> : null}</Dialog></div>
      <div className="grid min-h-0 gap-5 lg:h-full lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-3 lg:h-full lg:overflow-y-auto lg:pr-2"><div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-1 py-2 backdrop-blur"><h2 className="text-sm font-semibold text-ink">Results</h2><span className="text-xs text-muted">{filteredJobs.length.toLocaleString()} jobs</span></div>{filteredJobs.map((job) => <JobListItem key={job.id} job={job} selected={job.id === selectedJob?.id} onSelect={() => setSelectedJobId(job.id)} />)}</div>
        <div className="hidden min-w-0 lg:block lg:max-h-full lg:overflow-y-auto lg:pt-14">{selectedJob ? <JobDetail job={selectedJob} /> : null}</div>
      </div>
    </> : <Card className="glass-card p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Search className="size-5" /></div><h2 className="mt-4 font-semibold text-ink">No openings found</h2><p className="mt-2 text-sm text-muted">Try a broader search or clear one of your filters.</p><button onClick={() => { setQuery(""); setSelectedSources([]); setWorkplaceFilter("Any workplace"); }} className="mt-4 text-sm font-semibold text-primary">Clear filters</button></Card>}
    </div>
  </div>;
}
