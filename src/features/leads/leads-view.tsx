"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Download, Globe2, MapPin, Radar, Search, ScanLine } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { auditLeadWebsite, createGrowthWatch, listSavedLeads, removeSavedLead, saveLead, savedLeadKey, searchLeads, updateSavedLead, watchlistsKey, type LeadSearch } from "@/lib/api/leads";
import { canCaptureLead, leadCategories, leadContact, opportunityFor } from "@/lib/leads";
import { leadStatuses, type LocalLead, type SavedLead, type WebsiteAudit } from "@/types/leads";
import { LeadDetail } from "./lead-detail";
import { LeadResult } from "./lead-result";

const example = { locality: "Indiranagar, Bengaluru", category: "Dental clinics" };
const defaultRadius = "6000";
const demoStorage = "detectgrowth-demo-shortlist-v1";
const field = "min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const emptyLeads: SavedLead[] = [];

function exportShortlist(leads: SavedLead[]) {
  const columns = ["Business", "Category", "Address", "Search area", "Phone", "Email", "Website", "Stage", "Notes", "Listing", "Source", "Growth signal", "Priority", "Website checked at"];
  const csvCell = (value: string) => `"${(/^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
  const entries = leads.map((lead) => {
    const signal = opportunityFor(lead, lead.websiteAudit);
    return [lead.name, lead.category, lead.address, lead.locality, lead.phone, lead.email, lead.website, lead.status, lead.notes, lead.mapsUrl, lead.source, signal.observation, String(signal.score), lead.websiteAudit?.checkedAt ?? ""];
  });
  const file = new Blob(["\uFEFF", [columns, ...entries].map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "detectgrowth-shortlist.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LeadsView({ initialSearch }: { initialSearch?: LeadSearch }) {
  const user = useSession();
  const isGuest = user?.isDemo === true;
  const { showToast } = useToast();
  const client = useQueryClient();
  const [mobile, setMobile] = useState(false);
  const [form, setForm] = useState(() => initialSearch ? {
    locality: initialSearch.locality, category: initialSearch.category,
  } : example);
  const [submitted, setSubmitted] = useState<LeadSearch | null>(initialSearch ?? null);
  const [tab, setTab] = useState<"discover" | "saved">("discover");
  const [selectedId, setSelectedId] = useState("");
  const [contactOnly, setContactOnly] = useState(false);
  const [stageFilter, setStageFilter] = useState("");
  const [signalFilter, setSignalFilter] = useState("");
  const operations = useRef(new Map<string, "capture" | "check">());
  const [captureErrors, setCaptureErrors] = useState<Record<string, string>>({});
  const [pendingById, setPendingById] = useState<Record<string, "capture" | "check">>({});
  const [audits, setAudits] = useState<Record<string, WebsiteAudit>>({});
  const [demoSaved, setDemoSaved] = useState<SavedLead[]>([]);
  const demoRecords = useRef<SavedLead[]>([]);
  const key = savedLeadKey(user?.id ?? "");
  const shortlist = useQuery({ queryKey: key, queryFn: listSavedLeads, enabled: Boolean(user && !isGuest), retry: false });
  const search = useQuery({
    queryKey: ["business-discovery", submitted],
    queryFn: ({ signal }) => searchLeads(submitted!, signal),
    enabled: Boolean(submitted),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const watch = useMutation({
    mutationFn: ({ criteria, demo }: { criteria: LeadSearch; demo: boolean }) =>
      createGrowthWatch({ locality: criteria.locality, category: criteria.category, radius: Number(criteria.radius) }, demo),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: watchlistsKey(user?.id ?? "") });
      showToast("Market saved to Growth Watchlists.");
    },
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isGuest) return;
    try {
      const records = JSON.parse(window.localStorage.getItem(demoStorage) ?? "[]");
      if (Array.isArray(records)) { demoRecords.current = records; setDemoSaved(records); }
    } catch {
      demoRecords.current = [];
      setDemoSaved([]);
    }
  }, [isGuest]);

  const saved = isGuest ? demoSaved : shortlist.data ?? emptyLeads;
  const savedById = new Map(saved.map((lead) => [lead.id, lead]));
  const discovered = search.data?.leads ?? [];
  const results = tab === "saved" ? saved : discovered;
  const auditKey = (lead: LocalLead) => JSON.stringify([lead.id, lead.website]);
  const auditFor = (lead: LocalLead) => {
    const savedLead = savedById.get(lead.id);
    const snapshot = savedLead?.website === lead.website ? savedLead.websiteAudit : undefined;
    const current = audits[auditKey(lead)];
    return current && (!snapshot || Date.parse(current.checkedAt) >= Date.parse(snapshot.checkedAt)) ? current : snapshot;
  };
  const resultRows = results.map((lead) => {
    const contact = leadContact(lead);
    return { lead, signal: opportunityFor(lead, auditFor(lead)), directContact: Boolean(contact.phone || contact.email) };
  });
  const contactCount = resultRows.filter(({ directContact }) => directContact).length;
  const signalCount = resultRows.filter(({ signal }) => signal.kind !== "research").length;
  const visible = resultRows.filter(({ lead, signal, directContact }) => (
    (!contactOnly || directContact) &&
    (!signalFilter || signal.kind === signalFilter) &&
    (tab !== "saved" || !stageFilter || savedById.get(lead.id)?.status === stageFilter)
  )).sort((a, b) => b.signal.score - a.signal.score);
  const selected = visible.find(({ lead }) => lead.id === selectedId)?.lead ?? (mobile ? undefined : visible[0]?.lead);

  function submit(mode?: "demo") {
    const next = { ...form, locality: form.locality.trim(), radius: defaultRadius, ...(mode ? { mode } : {}) };
    if (next.locality.length < 2) return;
    setSelectedId("");
    setTab("discover");
    watch.reset();
    if (JSON.stringify(next) === JSON.stringify(submitted)) void search.refetch();
    else setSubmitted(next);
  }

  function writeDemo(records: SavedLead[]) {
    window.localStorage.setItem(demoStorage, JSON.stringify(records));
    demoRecords.current = records;
    setDemoSaved(records);
  }

  function startOperation(id: string, operation: "capture" | "check") {
    if (operations.current.has(id)) return false;
    operations.current.set(id, operation);
    setPendingById(Object.fromEntries(operations.current));
    return true;
  }

  function finishOperation(id: string) {
    operations.current.delete(id);
    setPendingById(Object.fromEntries(operations.current));
  }

  async function toggleSave(lead: LocalLead, shouldSave: boolean) {
    if (!startOperation(lead.id, "capture")) return;
    setCaptureErrors((current) => ({ ...current, [lead.id]: "" }));
    try {
      const websiteAudit = auditFor(lead);
      if (isGuest) {
        const records = demoRecords.current;
        if (shouldSave && !records.some((item) => item.id === lead.id)) {
          if (records.length >= 100) throw new Error("Remove a lead to add another.");
          writeDemo([{ ...lead, status: "New", notes: "", savedAt: new Date().toISOString(), websiteAudit }, ...records]);
        } else if (!shouldSave) writeDemo(records.filter((item) => item.id !== lead.id));
      } else if (shouldSave) {
        const record = await saveLead(lead, websiteAudit);
        await client.cancelQueries({ queryKey: key });
        client.setQueryData<SavedLead[]>(key, (current = []) => [record, ...current.filter((item) => item.id !== record.id)]);
        void client.invalidateQueries({ queryKey: key });
      } else {
        await removeSavedLead(lead.id);
        await client.cancelQueries({ queryKey: key });
        client.setQueryData<SavedLead[]>(key, (current = []) => current.filter((item) => item.id !== lead.id));
        void client.invalidateQueries({ queryKey: key });
      }
      showToast(shouldSave ? "Lead captured in your shortlist." : "Lead removed from your shortlist.");
    } finally {
      finishOperation(lead.id);
    }
  }

  async function update(lead: LocalLead, changes: Partial<Pick<SavedLead, "status" | "notes" | "websiteAudit">>) {
    if (isGuest) writeDemo(demoRecords.current.map((item) => item.id === lead.id ? { ...item, ...changes } : item));
    else {
      const record = await updateSavedLead(lead.id, changes);
      await client.cancelQueries({ queryKey: key });
      client.setQueryData<SavedLead[]>(key, (current = []) => current.map((item) => item.id === record.id ? record : item));
    }
    if (!changes.websiteAudit) showToast(changes.notes !== undefined ? "Notes saved." : "Lead stage updated.");
  }

  const detail = selected && <LeadDetail
    key={selected.id}
    lead={selected}
    saved={savedById.get(selected.id)}
    audit={auditFor(selected)}
    pending={pendingById[selected.id]}
    onCheck={async () => {
      if (!startOperation(selected.id, "check")) return;
      try {
        const audit = await auditLeadWebsite(selected.website);
        setAudits((current) => ({ ...current, [auditKey(selected)]: audit }));
        if (savedById.get(selected.id)?.website === selected.website) await update(selected, { websiteAudit: audit });
      } finally {
        finishOperation(selected.id);
      }
    }}
    onSave={(value) => toggleSave(selected, value)}
    onUpdate={(changes) => update(selected, changes)}
    isGuest={isGuest}
  />;

  const pending = tab === "discover" ? search.isFetching : shortlist.isLoading;
  const error = tab === "discover" ? search.error : shortlist.error;
  const source = search.data?.source;

  return <div className="mx-auto max-w-[1340px] space-y-6 pb-5">
    <section className="relative isolate overflow-hidden rounded-2xl bg-[#203b34] px-5 py-7 text-white sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 aspect-square opacity-50 [background:repeating-radial-gradient(circle_at_70%_50%,transparent_0_26px,rgba(211,234,205,.28)_27px,transparent_28px_47px),radial-gradient(circle_at_70%_50%,#61816b,transparent_68%)]" />
      <p className="flex items-center gap-2 text-sm font-medium text-[#d2e6cd]"><Radar className="size-5" aria-hidden="true" />DetectGrowth</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Spot growth gaps in local businesses</h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-[#e0ebdf]">Scan a market for website gaps, review the evidence, and capture leads worth following up.</p>
    </section>

    <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="grid gap-4 rounded-2xl border border-border bg-white p-4 shadow-soft sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] xl:items-end">
      <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">City or neighborhood
        <span className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" aria-hidden="true" />
          <input required minLength={2} maxLength={120} className={`${field} pl-9`} value={form.locality} onChange={(event) => setForm({ ...form, locality: event.target.value })} />
        </span>
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">Business type
        <select className={field} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
          {Object.keys(leadCategories).map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <Button size="lg" className="self-end" disabled={search.isFetching || watch.isPending || form.locality.trim().length < 2}><Search className="size-4" aria-hidden="true" />{search.isFetching ? "Searching…" : "Find leads"}</Button>
    </form>

    <section aria-label="Lead workspace">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 rounded-xl bg-elevated p-1">
          <Button type="button" size="sm" variant={tab === "discover" ? "secondary" : "ghost"} aria-pressed={tab === "discover"} onClick={() => { setTab("discover"); setSelectedId(""); }}>Discover</Button>
          <Button type="button" size="sm" variant={tab === "saved" ? "secondary" : "ghost"} aria-pressed={tab === "saved"} onClick={() => { setTab("saved"); setSelectedId(""); }}><Bookmark className="size-4" aria-hidden="true" />Shortlist{saved.length > 0 && <span className="tabular-nums text-muted">{saved.length}</span>}</Button>
        </div>
        {tab === "saved" && <Button type="button" variant="secondary" size="sm" disabled={!visible.some(({ lead }) => lead.source === "OpenStreetMap")} onClick={() => exportShortlist(visible.flatMap(({ lead }) => lead.source === "OpenStreetMap" ? [savedById.get(lead.id)!] : []))}><Download className="size-4" aria-hidden="true" />Export CSV</Button>}
      </div>

      {(tab === "saved" || submitted) && !error && <div className="my-4 flex flex-wrap items-center justify-between gap-3">
        <div aria-live="polite">
          <h2 className="text-lg font-semibold text-ink">{tab === "saved" ? "Saved leads" : pending && !search.data ? "Looking up businesses" : `${results.length} ${results.length === 1 ? "business" : "businesses"} found`}</h2>
          {tab === "discover" && search.data?.resolvedLocality && <p className="text-sm text-muted">{search.data.resolvedLocality}</p>}
          {results.length > 0 && <p className="text-sm text-muted">{signalCount} with a growth signal · {contactCount} with direct contact{visible.length !== results.length ? ` · ${visible.length} shown` : ""}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tab === "discover" && submitted && search.data?.resolvedLocality && source !== "Google Places" &&
            (watch.data ? <Button asChild variant="secondary" size="sm"><Link href={`/watchlists?watch=${watch.data.id}`}>Open watchlist</Link></Button> :
              <Button type="button" variant="secondary" size="sm" disabled={watch.isPending || pending} onClick={() => watch.mutate({ criteria: submitted, demo: source === "Demo" })}><ScanLine className="size-4" aria-hidden="true" />{watch.isPending ? "Saving watchlist…" : "Save as watchlist"}</Button>)}
          <select aria-label="Filter by growth signal" className="h-9 rounded-lg border border-border bg-white px-2 text-sm text-ink" value={signalFilter} onChange={(event) => { setSignalFilter(event.target.value); setSelectedId(""); }}>
            <option value="">All signals</option><option value="listing">Website link missing</option><option value="audit">Website check findings</option><option value="research">Needs research</option>
          </select>
          {tab === "saved" && <select className="h-9 rounded-lg border border-border bg-white px-2 text-sm text-ink" aria-label="Filter by stage" value={stageFilter} onChange={(event) => { setStageFilter(event.target.value); setSelectedId(""); }}><option value="">All stages</option>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select>}
          <label className="inline-flex min-h-9 items-center gap-2 text-sm text-ink"><input type="checkbox" checked={contactOnly} onChange={(event) => { setContactOnly(event.target.checked); setSelectedId(""); }} className="size-4 accent-primary" />With phone or email</label>
        </div>
      </div>}

      {tab === "discover" && watch.error && <p role="alert" className="mb-3 text-sm text-danger">{watch.error.message}</p>}
      {tab === "discover" && search.data?.limitedCoverage && <p className="mb-3 rounded-xl border border-border bg-elevated p-3 text-sm text-muted">Showing results from the map name index. These records may have limited coverage and omit websites and contact details.</p>}
      {tab === "discover" && source === "Demo" && <p className="mb-3 rounded-xl border border-border bg-elevated p-3 text-sm text-muted">Example results use fictional business and contact details.</p>}
      {tab === "saved" && isGuest && <p className="mb-3 text-sm text-muted">Your demo shortlist is stored in this browser.</p>}

      {error ? <div className="mt-4 rounded-2xl border border-border bg-white p-6" role="alert">
        <h2 className="font-semibold text-ink">{tab === "saved" ? "Shortlist unavailable" : "Search unavailable"}</h2>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void (tab === "saved" ? shortlist.refetch() : search.refetch())}>Try again</Button>
          {tab === "discover" && <Button type="button" variant="secondary" onClick={() => submit("demo")}>View example results</Button>}
        </div>
      </div> : pending && !results.length ? <div className="grid gap-4 lg:grid-cols-[minmax(265px,.9fr)_minmax(0,1.6fr)]" role="status" aria-label="Loading leads">
        <div className="space-y-3">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-24 rounded-xl" />)}</div><Skeleton className="hidden h-80 rounded-2xl lg:block" />
      </div> : !visible.length ? <div className="mt-4 rounded-2xl border border-dashed border-border bg-white p-8 text-center sm:p-12">
        <Globe2 className="mx-auto size-7 text-primary" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-ink">{results.length ? "No leads match these filters" : tab === "saved" ? "Your shortlist is empty" : !submitted ? "Choose a market to start" : !search.data?.resolvedLocality ? "Location not found" : "No matching businesses found"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{results.length ? "Clear your filters to see more leads." : tab === "saved" ? "Save a business from Discover to track its stage and notes." : !submitted ? "Choose a city and business type to find prospects." : !search.data?.resolvedLocality ? "Try the city name with its state or country." : "Try a nearby city or a different business type."}</p>
        {results.length > 0 && <Button type="button" variant="secondary" className="mt-4" onClick={() => { setContactOnly(false); setStageFilter(""); setSignalFilter(""); }}>Clear filters</Button>}
        {tab === "discover" && !submitted && <Button type="button" variant="secondary" className="mt-4" onClick={() => submit("demo")}>View example results</Button>}
      </div> : <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(265px,.9fr)_minmax(0,1.6fr)]">
        <ul className="min-w-0 space-y-2.5 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-2" aria-label="Lead results">
          {visible.map(({ lead, signal }) => <LeadResult
            key={lead.id}
            lead={lead}
            signal={signal}
            saved={savedById.get(lead.id)}
            selected={selected?.id === lead.id}
            canCapture={canCaptureLead(lead, isGuest)}
            pending={pendingById[lead.id]}
            error={captureErrors[lead.id]}
            onSelect={() => setSelectedId(lead.id)}
            onCapture={() => void toggleSave(lead, true).catch((failure: Error) => setCaptureErrors((current) => ({ ...current, [lead.id]: failure.message })))}
          />)}
        </ul>
        {!mobile && detail}
      </div>}

      {((source === "OpenStreetMap" && tab === "discover") || (tab === "saved" && saved.some((lead) => lead.source === "OpenStreetMap"))) && <p className="mt-4 text-sm text-muted"><a className="underline underline-offset-4" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p>}
      {source === "Google Places" && tab === "discover" && <p className="mt-4 text-sm font-semibold text-ink">Google Maps</p>}
    </section>
    {mobile && <Dialog open={Boolean(detail)} onClose={() => setSelectedId("")} title="Lead details" className="max-w-2xl">{detail}</Dialog>}
  </div>;
}
