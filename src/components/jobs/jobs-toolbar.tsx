"use client";

import * as React from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { ChevronDown, RefreshCw, Search, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const workplaceOptions = ["Any workplace", "Remote", "Hybrid", "On-site"] as const;
type Workplace = (typeof workplaceOptions)[number];
export type { Workplace };

type JobsToolbarProps = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  searchRef: RefObject<HTMLInputElement | null>;
  sourceOptions: string[];
  selectedSources: string[];
  setSelectedSources: Dispatch<SetStateAction<string[]>>;
  workplaceFilter: Workplace;
  setWorkplaceFilter: Dispatch<SetStateAction<Workplace>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  greenhouseBoards: string;
  setGreenhouseBoards: Dispatch<SetStateAction<string>>;
  leverBoards: string;
  setLeverBoards: Dispatch<SetStateAction<string>>;
  loading: boolean;
  loadJobs: () => void;
  resultCount: number;
  totalCount: number;
};

export function JobsToolbar({
  query, setQuery, searchRef, sourceOptions, selectedSources, setSelectedSources,
  workplaceFilter, setWorkplaceFilter, sort, setSort, greenhouseBoards, setGreenhouseBoards,
  leverBoards, setLeverBoards, loading, loadJobs, resultCount, totalCount,
}: JobsToolbarProps) {
  const [sourceMenuOpen, setSourceMenuOpen] = React.useState(false);
  const [sourcesOpen, setSourcesOpen] = React.useState(false);

  return <Card className="sticky top-0 z-20 mx-4 shrink-0 overflow-visible border-border bg-white p-3 shadow-[0_2px_10px_rgba(55,52,44,.04)] md:mx-6 lg:mx-7">
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-border bg-white px-3 py-1 shadow-[0_1px_2px_rgba(55,52,44,.04)] sm:gap-3"><Search className="size-5 shrink-0 text-muted" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search jobs" placeholder="Search jobs by title, company, or location" className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-muted" />{query ? <button aria-label="Clear search" onClick={() => setQuery("")} className="rounded-full p-1.5 text-muted hover:bg-elevated"><X className="size-4" /></button> : null}<button type="button" aria-label="Refresh job listings" title="Refresh job listings" onClick={loadJobs} disabled={loading} className="rounded-full p-1.5 text-muted transition hover:bg-elevated disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button><kbd className="hidden rounded-md bg-elevated px-2 py-1 text-[10px] text-muted sm:block">⌘ K</kbd></div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex-none"><div className="relative"><Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setSourceMenuOpen((open) => !open)} aria-expanded={sourceMenuOpen} aria-haspopup="listbox">{selectedSources.length ? `${selectedSources.length} sources` : "All sources"}<ChevronDown className={`size-3.5 transition-transform ${sourceMenuOpen ? "rotate-180" : ""}`} /></Button>{sourceMenuOpen ? <div className="absolute left-0 top-10 z-30 w-64 rounded-2xl border border-border bg-white p-2 shadow-[0_16px_40px_rgba(55,52,44,.12)]" role="listbox" aria-label="Filter by source"><button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-ink hover:bg-elevated" onClick={() => setSelectedSources([])}><span className={`grid size-4 place-items-center rounded border ${selectedSources.length === 0 ? "border-primary bg-primary text-white" : "border-border"}`}>{selectedSources.length === 0 ? "✓" : null}</span>All sources</button>{sourceOptions.slice(1).map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink hover:bg-elevated"><input type="checkbox" checked={selectedSources.includes(item)} onChange={(event) => setSelectedSources((current) => event.target.checked ? [...current, item] : current.filter((sourceName) => sourceName !== item))} className="size-4 rounded border-border text-primary" />{item}</label>)}</div> : null}</div><label className="relative"><span className="sr-only">Workplace</span><select aria-label="Filter by workplace" value={workplaceFilter} onChange={(event) => setWorkplaceFilter(event.target.value as Workplace)} className="h-8 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50"><option>Any workplace</option>{workplaceOptions.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-3 text-muted" /></label><label className="relative"><span className="sr-only">Sort jobs</span><select aria-label="Sort jobs" value={sort} onChange={(event) => setSort(event.target.value)} className="h-8 appearance-none rounded-xl border border-border bg-white pl-3 pr-8 text-xs font-medium text-muted outline-none focus:border-primary/50"><option>Newest first</option><option>Company A–Z</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-3 text-muted" /></label><span aria-live="polite" className="text-xs text-muted">{resultCount.toLocaleString()} of {totalCount.toLocaleString()} jobs</span></div><Button variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => setSourcesOpen((open) => !open)} aria-expanded={sourcesOpen} aria-controls="job-sources-panel"><Settings2 className="size-3.5" />{sourcesOpen ? "Hide sources" : "Manage sources"}<ChevronDown className={`size-3.5 transition-transform ${sourcesOpen ? "rotate-180" : ""}`} /></Button>
      {sourcesOpen ? <div id="job-sources-panel" className="basis-full grid gap-3 border-t border-border/80 pt-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="min-w-0 text-xs font-medium text-muted">Greenhouse companies<Input value={greenhouseBoards} onChange={(event) => setGreenhouseBoards(event.target.value)} placeholder="airbnb, google" className="mt-1.5 h-9 min-w-0" /></label><label className="min-w-0 text-xs font-medium text-muted">Lever companies<Input value={leverBoards} onChange={(event) => setLeverBoards(event.target.value)} placeholder="netflix, stripe" className="mt-1.5 h-9 min-w-0" /></label><Button className="h-9 w-full sm:w-auto" onClick={loadJobs} disabled={loading}><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />Update jobs</Button></div> : null}
    </div>
  </Card>;
}
