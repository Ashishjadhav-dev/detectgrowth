"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, ChevronDown, MapPin, RefreshCw, Search, Settings2, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  return <Card className="glass-card overflow-hidden"><div className="border-b border-border/80 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><CompanyLogo job={job} className="size-12" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${sourceClass(job.source)}`}>{job.source}</span><span className="text-xs text-muted">{relativeDate(job.postedAt)}</span></div><h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-ink sm:text-2xl">{job.title}</h2><p className="mt-1 text-sm font-medium text-muted">{job.company}</p></div></div><div className="flex w-full gap-2 sm:w-auto"><Button variant="secondary" size="sm" className="flex-1 sm:flex-none" aria-label="Save job"><Bookmark className="size-4" />Save</Button><Button asChild size="sm" className="flex-1 sm:flex-none"><a href={job.url} target="_blank" rel="noreferrer">Apply now <ArrowUpRight className="size-4" /></a></Button></div></div><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{job.location || "Location not listed"}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Posted {relativeDate(job.postedAt).toLowerCase()}</span></div><div className="mt-4 flex flex-wrap gap-2">{metadataTags.map((tag) => <Badge key={tag} className={"border border-border bg-white text-muted"}>{tag}</Badge>)}</div></div><div className="p-5 sm:p-6"><h3 className="text-sm font-semibold text-ink">About this role</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{job.description || "No description was provided for this opening."}</p><a href={job.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover">View full posting <ArrowUpRight className="size-4" /></a></div></Card>;
}

function JobCardSkeleton() {
  return <Card className="min-w-0 p-4 sm:p-5" aria-hidden="true"><div className="flex items-start gap-3"><Skeleton className="size-11 shrink-0 rounded-2xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-2/5" /></div><Skeleton className="size-8 rounded-xl" /></div><div className="mt-5 flex gap-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-20" /></div><div className="mt-4 flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div><div className="mt-4 space-y-2"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-11/12" /><Skeleton className="h-3.5 w-3/5" /></div><div className="mt-5 flex justify-end"><Skeleton className="h-4 w-24" /></div></Card>;
}

export function JobsView() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [query, setQuery] = useState("");
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
    const params = new URLSearchParams({ greenhouse: greenhouseBoards, lever: leverBoards });
    fetch(`/api/jobs?${params}`).then(async (response) => { if (!response.ok) throw new Error("Unable to load job feeds"); return response.json() as Promise<JobsResponse>; }).then((payload) => { setData(payload); setSelectedSources([]); setError(null); }).catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false));
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
      return (!normalized || searchable.includes(normalized)) && (!selectedSources.length || selectedSources.includes(job.source)) && (workplaceFilter === "Any workplace" || job.workplace === workplaceFilter);
    }).sort((a, b) => sort === "Company A–Z" ? a.company.localeCompare(b.company) : (new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime()));
  }, [data, query, selectedSources, sort, workplaceFilter]);

  const sourceOptions = ["All sources", ...Object.keys(data?.sources ?? {})];
  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0];
  return <div className="-mx-4 -my-4 flex min-h-[calc(100vh-4rem)] flex-col bg-white md:-mx-6 lg:-mx-7 lg:h-[calc(100vh-4.25rem)] lg:overflow-hidden">
    <JobsToolbar query={query} setQuery={setQuery} searchRef={searchRef} sourceOptions={sourceOptions} selectedSources={selectedSources} setSelectedSources={setSelectedSources} workplaceFilter={workplaceFilter} setWorkplaceFilter={setWorkplaceFilter} sort={sort} setSort={setSort} greenhouseBoards={greenhouseBoards} setGreenhouseBoards={setGreenhouseBoards} leverBoards={leverBoards} setLeverBoards={setLeverBoards} loading={loading} loadJobs={loadJobs} resultCount={filteredJobs.length} totalCount={data?.jobs.length ?? 0} />
    <div className="hidden">
    <section className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-3 md:px-6 lg:px-7">
      <div className="flex max-w-4xl items-center gap-2 rounded-full border border-[#b8bcc4] bg-white px-3 py-1 shadow-[0_1px_2px_rgba(0,0,0,.06)] sm:gap-3"><Search className="size-5 shrink-0 text-[#4f5358]" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search jobs" placeholder="Search jobs by title, company, or location" className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-[#6f7378]" />{query ? <button aria-label="Clear search" onClick={() => setQuery("")} className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><X className="size-4" /></button> : null}<button type="button" aria-label="Refresh job listings" title="Refresh job listings" onClick={loadJobs} disabled={loading} className="rounded-full p-1.5 text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button><kbd className="hidden rounded-md bg-[#f1f3f4] px-2 py-1 text-[10px] text-[#5f6368] sm:block">⌘ K</kbd></div>
    </section>

    <div className="flex shrink-0 justify-end px-4 pt-2 md:px-6 lg:px-7"><Button variant="ghost" className="h-9 px-2.5 text-xs" onClick={() => setSourcesOpen((open) => !open)} aria-expanded={sourcesOpen} aria-controls="job-sources-panel"><Settings2 className="size-3.5" />{sourcesOpen ? "Hide sources" : "Manage sources"}<ChevronDown className={`size-3.5 transition-transform ${sourcesOpen ? "rotate-180" : ""}`} /></Button></div>
    {sourcesOpen ? <Card id="job-sources-panel" className="glass-card mx-4 min-w-0 shrink-0 overflow-hidden p-4 md:mx-6 lg:mx-7"><div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold text-ink"><BriefcaseBusiness className="size-4 shrink-0 text-primary" />Companies to include</div><p className="mt-1 max-w-xl break-words text-xs leading-5 text-muted">Add company names as they appear in their public careers URL. Separate multiple companies with commas, for example: airbnb, google, stripe.</p></div><div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:min-w-0 lg:flex-1"><label className="min-w-0 text-xs font-medium text-muted">Greenhouse companies<Input value={greenhouseBoards} onChange={(event) => setGreenhouseBoards(event.target.value)} placeholder="airbnb, google" className="mt-1.5 h-9 min-w-0" /></label><label className="min-w-0 text-xs font-medium text-muted">Lever companies<Input value={leverBoards} onChange={(event) => setLeverBoards(event.target.value)} placeholder="netflix, stripe" className="mt-1.5 h-9 min-w-0" /></label></div><Button className="h-9 w-full shrink-0 lg:w-auto" onClick={loadJobs} disabled={loading}><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Update jobs</Button></div></Card> : null}
    <section className="flex shrink-0 flex-col gap-4 px-4 pt-2 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><SlidersHorizontal className="mr-1 size-4 shrink-0 text-muted" /><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Filters</span><div className="relative"><Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => setSourceMenuOpen((open) => !open)} aria-expanded={sourceMenuOpen} aria-haspopup="listbox">{selectedSources.length ? `${selectedSources.length} sources` : "All sources"}<ChevronDown className={`size-3.5 transition-transform ${sourceMenuOpen ? "rotate-180" : ""}`} /></Button>{sourceMenuOpen ? <div className="absolute left-0 top-11 z-30 w-64 rounded-2xl border border-border bg-white p-2 shadow-[0_16px_40px_rgba(23,27,43,.14)]" role="listbox" aria-label="Filter by source"><button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-ink hover:bg-elevated" onClick={() => setSelectedSources([])}><span className={`grid size-4 place-items-center rounded border ${selectedSources.length === 0 ? "border-primary bg-primary text-white" : "border-border"}`}>{selectedSources.length === 0 ? "✓" : null}</span>All sources</button>{sourceOptions.slice(1).map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink hover:bg-elevated"><input type="checkbox" checked={selectedSources.includes(item)} onChange={(event) => setSelectedSources((current) => event.target.checked ? [...current, item] : current.filter((sourceName) => sourceName !== item))} className="size-4 rounded border-border text-primary" />{item}</label>)}</div> : null}</div></div><p aria-live="polite" className="mt-2 text-xs text-muted">Showing {filteredJobs.length.toLocaleString()} of {(data?.jobs.length ?? 0).toLocaleString()} openings</p></div><div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><label className="relative"><span className="sr-only">Workplace</span><select aria-label="Filter by workplace" value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value as typeof workplaceFilter)} className="h-10 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50 sm:h-9 sm:w-auto"><option>Any workplace</option>{workplaceOptions.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3.5 size-3 text-muted sm:top-3" /></label><label className="relative"><span className="sr-only">Sort jobs</span><select aria-label="Sort jobs" value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50 sm:h-9 sm:w-auto"><option>Newest first</option><option>Company A–Z</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-3 text-muted sm:top-3" /></label></div></section>

    </div>
    {error ? <div className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 md:mx-6 lg:mx-7">{error}. Try refreshing the feed.</div> : null}
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:px-6 lg:overflow-hidden lg:px-7">
    {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading job listings">{[1, 2, 3, 4, 5, 6].map((item) => <JobCardSkeleton key={item} />)}</div> : filteredJobs.length ? <>
      {selectedJobId && selectedJob ? <div className="fixed inset-0 z-40 flex items-end bg-ink/35 lg:hidden" role="dialog" aria-modal="true" aria-label={`${selectedJob.title} details`} onClick={() => setSelectedJobId(null)}><div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-canvas p-3 pt-12 shadow-[0_-18px_50px_rgba(55,52,44,.18)] sm:mx-4 sm:mb-4 sm:rounded-3xl sm:p-4 sm:pt-12" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close job details" onClick={() => setSelectedJobId(null)} className="absolute right-4 top-3 rounded-full border border-border bg-white p-2 text-muted transition hover:bg-elevated"><X className="size-4" /></button><JobDetail job={selectedJob} /></div></div> : null}
      <div className="grid min-h-0 gap-5 lg:h-full lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-3 lg:h-full lg:overflow-y-auto lg:pr-2"><div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-1 py-2 backdrop-blur"><h2 className="text-sm font-semibold text-ink">Results</h2><span className="text-xs text-muted">{filteredJobs.length.toLocaleString()} jobs</span></div>{filteredJobs.map((job) => <JobListItem key={job.id} job={job} selected={job.id === selectedJob?.id} onSelect={() => setSelectedJobId(job.id)} />)}</div>
        <div className="hidden min-w-0 lg:block lg:max-h-full lg:overflow-y-auto lg:pt-14">{selectedJob ? <JobDetail job={selectedJob} /> : null}</div>
      </div>
    </> : <Card className="glass-card p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Search className="size-5" /></div><h2 className="mt-4 font-semibold text-ink">No openings found</h2><p className="mt-2 text-sm text-muted">Try a broader search or clear one of your filters.</p><button onClick={() => { setQuery(""); setSelectedSources([]); setWorkplaceFilter("Any workplace"); }} className="mt-4 text-sm font-semibold text-primary">Clear filters</button></Card>}
    </div>
  </div>;
}
