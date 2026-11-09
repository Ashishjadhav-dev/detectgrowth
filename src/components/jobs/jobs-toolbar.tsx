"use client";

import * as React from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { ChevronDown, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EMPLOYMENT_TYPE_OPTIONS, INDIA_LOCATION_OPTIONS, POSTED_WITHIN_OPTIONS, type EmploymentTypeFilter, type IndiaLocationFilter, type PostedWithinFilter } from "@/types/jobs";

const workplaceOptions = ["Any workplace", "Remote", "Hybrid", "On-site"] as const;
type Workplace = (typeof workplaceOptions)[number];
export type { Workplace };

function ToolbarSelect({ label, value, options, onChange, open, setOpen, onOpen }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>>; onOpen: () => void }) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => { if (open && menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open, setOpen]);
  return <div ref={menuRef} className="relative"><Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => { if (!open) onOpen(); setOpen((current) => !current); }} aria-label={label} aria-expanded={open} aria-haspopup="listbox">{value}<ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></Button>{open ? <div className="absolute left-0 top-11 z-30 min-w-full rounded-2xl border border-border bg-white p-2 shadow-[0_16px_40px_rgba(55,52,44,.12)]" role="listbox" aria-label={label}>{options.map((option) => <button key={option} type="button" role="option" aria-selected={option === value} className={`flex w-full whitespace-nowrap rounded-xl px-3 py-2 text-left text-xs font-medium ${option === value ? "bg-elevated text-ink" : "text-muted hover:bg-elevated hover:text-ink"}`} onClick={() => { onChange(option); setOpen(false); }}>{option}</button>)}</div> : null}</div>;
}

type JobsToolbarProps = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  searchRef: RefObject<HTMLInputElement | null>;
  sourceOptions: string[];
  selectedSources: string[];
  setSelectedSources: Dispatch<SetStateAction<string[]>>;
  workplaceFilter: Workplace;
  setWorkplaceFilter: Dispatch<SetStateAction<Workplace>>;
  locationFilter: IndiaLocationFilter;
  setLocationFilter: Dispatch<SetStateAction<IndiaLocationFilter>>;
  employmentTypeFilter: EmploymentTypeFilter;
  setEmploymentTypeFilter: Dispatch<SetStateAction<EmploymentTypeFilter>>;
  postedWithin: PostedWithinFilter;
  setPostedWithin: Dispatch<SetStateAction<PostedWithinFilter>>;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;
  loading: boolean;
  loadJobs: () => void;
  resultCount: number;
  totalCount: number;
};

export function JobsToolbar({
  query, setQuery, searchRef, sourceOptions, selectedSources, setSelectedSources,
  workplaceFilter, setWorkplaceFilter, locationFilter, setLocationFilter, employmentTypeFilter, setEmploymentTypeFilter,
  postedWithin, setPostedWithin, sort, setSort, loading, loadJobs, resultCount, totalCount,
}: JobsToolbarProps) {
  const [sourceMenuOpen, setSourceMenuOpen] = React.useState(false);
  const [workplaceMenuOpen, setWorkplaceMenuOpen] = React.useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = React.useState(false);
  const [employmentMenuOpen, setEmploymentMenuOpen] = React.useState(false);
  const [postedMenuOpen, setPostedMenuOpen] = React.useState(false);
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false);
  const sourceMenuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => { if (sourceMenuOpen && sourceMenuRef.current && !sourceMenuRef.current.contains(event.target as Node)) setSourceMenuOpen(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [sourceMenuOpen]);

  return <Card className="sticky top-0 z-20 mx-4 shrink-0 overflow-visible rounded-2xl border-border bg-white p-3 shadow-[0_2px_10px_rgba(55,52,44,.04)] md:mx-6 md:p-4 lg:mx-7">
    <div className="flex flex-wrap items-center gap-2">
      <div className="basis-full flex min-w-0 items-center gap-2 rounded-full border border-border bg-white px-3 py-0 h-9 shadow-[0_1px_2px_rgba(55,52,44,.04)] lg:basis-auto lg:flex-1 sm:gap-3"><Search className="size-5 shrink-0 text-muted" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search jobs" placeholder="Search jobs by title, company, or location" className="h-8 min-w-0 flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-muted" />{query ? <button aria-label="Clear search" onClick={() => setQuery("")} className="rounded-full p-1.5 text-muted hover:bg-elevated"><X className="size-4" /></button> : null}<button type="button" aria-label="Refresh job listings" title="Refresh job listings" onClick={loadJobs} disabled={loading} className="rounded-full p-1.5 text-muted transition hover:bg-elevated disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button></div>
  <div className="basis-full mt-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:mt-0 lg:basis-auto lg:flex-none"><div ref={sourceMenuRef} className="relative"><Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => { setWorkplaceMenuOpen(false); setSortMenuOpen(false); setSourceMenuOpen((open) => !open); }} aria-expanded={sourceMenuOpen} aria-haspopup="listbox">{selectedSources.length ? `${selectedSources.length} sources` : "All sources"}<ChevronDown className={`size-3.5 transition-transform ${sourceMenuOpen ? "rotate-180" : ""}`} /></Button>{sourceMenuOpen ? <div className="absolute left-0 top-11 z-30 w-64 rounded-2xl border border-border bg-white p-2 shadow-[0_16px_40px_rgba(55,52,44,.12)]" role="listbox" aria-label="Filter by source"><button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-ink hover:bg-elevated" onClick={() => setSelectedSources([])}><span className={`grid size-4 place-items-center rounded border ${selectedSources.length === 0 ? "border-primary bg-primary text-white" : "border-border"}`}>{selectedSources.length === 0 ? "✓" : null}</span>All sources</button>{sourceOptions.slice(1).map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink hover:bg-elevated"><input type="checkbox" checked={selectedSources.includes(item)} onChange={(event) => setSelectedSources((current) => event.target.checked ? [...current, item] : current.filter((sourceName) => sourceName !== item))} className="size-4 rounded border-border text-primary" />{item}</label>)}</div> : null}</div><ToolbarSelect label="India location" value={locationFilter} options={INDIA_LOCATION_OPTIONS} onChange={(value) => setLocationFilter(value as IndiaLocationFilter)} open={locationMenuOpen} setOpen={setLocationMenuOpen} onOpen={() => { setSourceMenuOpen(false); setWorkplaceMenuOpen(false); setEmploymentMenuOpen(false); setPostedMenuOpen(false); setSortMenuOpen(false); }} /><ToolbarSelect label="Workplace" value={workplaceFilter} options={workplaceOptions} onChange={(value) => setWorkplaceFilter(value as Workplace)} open={workplaceMenuOpen} setOpen={setWorkplaceMenuOpen} onOpen={() => { setSourceMenuOpen(false); setLocationMenuOpen(false); setEmploymentMenuOpen(false); setPostedMenuOpen(false); setSortMenuOpen(false); }} /><ToolbarSelect label="Employment type" value={employmentTypeFilter} options={EMPLOYMENT_TYPE_OPTIONS} onChange={(value) => setEmploymentTypeFilter(value as EmploymentTypeFilter)} open={employmentMenuOpen} setOpen={setEmploymentMenuOpen} onOpen={() => { setSourceMenuOpen(false); setLocationMenuOpen(false); setWorkplaceMenuOpen(false); setPostedMenuOpen(false); setSortMenuOpen(false); }} /><ToolbarSelect label="Posted within" value={postedWithin} options={POSTED_WITHIN_OPTIONS} onChange={(value) => setPostedWithin(value as PostedWithinFilter)} open={postedMenuOpen} setOpen={setPostedMenuOpen} onOpen={() => { setSourceMenuOpen(false); setLocationMenuOpen(false); setWorkplaceMenuOpen(false); setEmploymentMenuOpen(false); setSortMenuOpen(false); }} /><ToolbarSelect label="Sort jobs" value={sort} options={["Newest", "Company A–Z"]} onChange={setSort} open={sortMenuOpen} setOpen={setSortMenuOpen} onOpen={() => { setSourceMenuOpen(false); setWorkplaceMenuOpen(false); setLocationMenuOpen(false); setEmploymentMenuOpen(false); setPostedMenuOpen(false); }} /><span aria-live="polite" className="text-xs text-muted">{resultCount.toLocaleString()} of {totalCount.toLocaleString()} jobs</span></div>

    </div>
  </Card>;
}
