"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Building2, Clock3, Globe2, MapPin, Radar, RefreshCw, Trash2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listGrowthWatches, listSavedLeads, recheckGrowthWatch, removeGrowthWatch, savedLeadKey, saveLead, watchlistsKey } from "@/lib/api/leads";
import { safeWebUrl } from "@/lib/leads";
import type { LocalLead, SavedLead } from "@/types/leads";
import type { GrowthWatch, WatchChange } from "@/types/watchlists";

const formatDate = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function MarketListing({ lead, changes, canCapture, saved, onCapture }: {
  lead: LocalLead;
  changes?: WatchChange[];
  canCapture: boolean;
  saved: boolean;
  onCapture: (lead: LocalLead) => Promise<void>;
}) {
  const capture = useMutation({ mutationFn: () => onCapture(lead) });
  const listing = safeWebUrl(lead.mapsUrl);
  const website = safeWebUrl(lead.website);
  return <li className="min-w-0 rounded-xl border border-border p-3.5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 gap-2.5">
        <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0"><p className="break-words font-semibold text-ink">{lead.name}</p><p className="mt-0.5 break-words text-sm text-muted">{lead.address || lead.locality}</p></div>
      </div>
      {canCapture && <Button type="button" variant="secondary" size="sm" disabled={saved || capture.isPending} onClick={() => capture.mutate()} aria-label={saved ? `${lead.name} captured` : `Capture ${lead.name}`}><Bookmark className="size-4" aria-hidden="true" />{saved ? "Captured" : capture.isPending ? "Capturing…" : "Capture"}</Button>}
    </div>
    {changes && <dl className="mt-3 space-y-2 rounded-lg bg-elevated p-3">
      {changes.map(({ field, before, after }) => <div key={field} className="min-w-0 text-sm">
        <dt className="font-medium text-ink">{field}</dt>
        <dd className="grid gap-1 text-muted sm:grid-cols-2 sm:gap-3">
          <span className="break-words"><span className="font-medium">Before</span> {before || "Unlisted"}</span>
          <span className="break-words text-ink"><span className="font-medium">Now</span> {after || "Unlisted"}</span>
        </dd>
      </div>)}
    </dl>}
    {(listing || website) && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {listing && <a className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline" href={listing} target="_blank" rel="noreferrer"><MapPin className="size-4" aria-hidden="true" />Source listing</a>}
      {website && <a className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline" href={website} target="_blank" rel="noreferrer"><Globe2 className="size-4" aria-hidden="true" />Website</a>}
    </div>}
    {capture.error && <p role="alert" className="mt-2 text-sm text-danger">{capture.error.message}</p>}
  </li>;
}

function WatchReport({ watch, canCapture, savedIds, onCapture }: {
  watch: GrowthWatch;
  canCapture: boolean;
  savedIds: Set<string>;
  onCapture: (lead: LocalLead) => Promise<void>;
}) {
  const report = watch.report;
  const comparable = report.status === "compared";
  const notices = {
    baseline: "First check saved. Recheck this market to compare it with this snapshot.",
    expanded: "This check found fuller directory coverage. It becomes the baseline for your next comparison.",
    limited: "The directory returned a limited result set. Your last full snapshot is ready for the next full check.",
    compared: "",
  };
  const search = new URLSearchParams({ ...watch.market, radius: String(watch.market.radius), ...(watch.demo ? { mode: "demo" } : {}) });

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>Checked <time dateTime={report.checkedAt}>{formatDate(report.checkedAt)}</time>{report.comparedWith && <> · Compared with <time dateTime={report.comparedWith}>{formatDate(report.comparedWith)}</time></>}</span></p>
      <Link href={`/leads?${search}`} className="font-semibold text-primary underline-offset-4 hover:underline">Open in lead discovery</Link>
    </div>
    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
      {[
        ["Listings checked", report.total],
        ["New", comparable ? report.newLeads.length : "—"],
        ["Changed", comparable ? report.changedLeads.length : "—"],
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-elevated p-2.5 sm:p-3"><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</dd></div>)}
    </dl>
    {notices[report.status] && <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-ink">{notices[report.status]}</p>}
    {report.limitedCoverage && report.status !== "limited" && <p className="text-sm text-muted">This check used the map name index, which can omit websites and contact details.</p>}
    {comparable && <div className="space-y-5">
      <section>
        <h3 className="font-semibold text-ink">New since last check</h3>
        {report.newLeads.length ? <ul className="mt-3 space-y-2">{report.newLeads.map((lead) => <MarketListing key={lead.id} lead={lead} canCapture={canCapture} saved={savedIds.has(lead.id)} onCapture={onCapture} />)}</ul> :
          <p className="mt-2 text-sm text-muted">No new listings in these results.</p>}
      </section>
      <section>
        <h3 className="font-semibold text-ink">Changed since last check</h3>
        {report.changedLeads.length ? <ul className="mt-3 space-y-2">{report.changedLeads.map(({ lead, changes }) => <MarketListing key={lead.id} lead={lead} changes={changes} canCapture={canCapture} saved={savedIds.has(lead.id)} onCapture={onCapture} />)}</ul> :
          <p className="mt-2 text-sm text-muted">The tracked listing details stayed the same.</p>}
      </section>
    </div>}
    {!watch.demo && <p className="text-sm text-muted"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline underline-offset-4">© OpenStreetMap contributors</a></p>}
  </div>;
}

export function WatchlistsView({ initialWatch }: { initialWatch: string }) {
  const user = useSession();
  const client = useQueryClient();
  const key = watchlistsKey(user?.id ?? "");
  const shortlistKey = savedLeadKey(user?.id ?? "");
  const [selectedId, setSelectedId] = useState(initialWatch);
  const [removing, setRemoving] = useState<GrowthWatch | null>(null);
  const watches = useQuery({ queryKey: key, queryFn: listGrowthWatches, enabled: Boolean(user), retry: false });
  const shortlist = useQuery({ queryKey: shortlistKey, queryFn: listSavedLeads, enabled: Boolean(user && !user.isDemo), retry: false });
  const entries = watches.data ?? [];
  const selected = entries.find((watch) => watch.id === selectedId) ?? entries[0];
  const savedIds = new Set((shortlist.data ?? []).map((lead) => lead.id));
  const recheck = useMutation({ mutationFn: recheckGrowthWatch, onSuccess: async (updated) => {
    await client.cancelQueries({ queryKey: key });
    client.setQueryData<GrowthWatch[]>(key, (current = []) => current.map((watch) => watch.id === updated.id ? updated : watch));
  } });
  const remove = useMutation({ mutationFn: removeGrowthWatch, onSuccess: async ({ id }) => {
    await client.cancelQueries({ queryKey: key });
    client.setQueryData<GrowthWatch[]>(key, (current = []) => current.filter((watch) => watch.id !== id));
    setRemoving(null);
  } });
  async function capture(lead: LocalLead) {
    const saved = await saveLead(lead);
    await client.cancelQueries({ queryKey: shortlistKey });
    client.setQueryData<SavedLead[]>(shortlistKey, (current = []) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    void client.invalidateQueries({ queryKey: shortlistKey });
  }

  return <div className="mx-auto max-w-[1340px] space-y-6 pb-5">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-[#203b34] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div>
        <h1 className="flex items-center gap-2.5 text-3xl font-semibold tracking-tight"><Radar className="size-7 shrink-0 text-[#d2e6cd]" aria-hidden="true" />Growth Watchlists</h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[#e0ebdf]">Recheck saved markets and see which business listings are new or changed.</p>
      </div>
      {entries.length > 0 && <Button asChild variant="secondary"><Link href="/leads">Find a market</Link></Button>}
    </header>

    {watches.isLoading ? <div className="grid gap-4 md:grid-cols-[minmax(210px,.8fr)_minmax(0,2fr)]" role="status" aria-label="Loading watchlists"><Skeleton className="h-36 rounded-xl" /><Skeleton className="h-56 rounded-xl" /></div> :
      watches.error && !entries.length ? <div role="alert" className="rounded-2xl border border-border bg-white p-6"><p className="text-sm text-danger">{watches.error.message}</p><Button type="button" className="mt-3" onClick={() => void watches.refetch()}>Try again</Button></div> :
      !selected ? <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center sm:p-12"><Radar className="mx-auto size-7 text-primary" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold text-ink">No saved markets yet</h2><p className="mt-2 text-sm text-muted">Run a search in Lead discovery and choose Save as watchlist.</p><Button asChild className="mt-4"><Link href="/leads">Go to Lead discovery</Link></Button></div> :
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(225px,.75fr)_minmax(0,2fr)]">
        <section className="min-w-0 rounded-2xl border border-border bg-white p-3.5">
          <h2 className="px-2 pb-2 font-semibold text-ink">Saved markets <span className="text-sm font-normal text-muted">({entries.length})</span></h2>
          <ul className="space-y-1.5">
            {entries.map((watch) => <li key={watch.id}>
              <button type="button" aria-pressed={watch.id === selected.id} onClick={() => setSelectedId(watch.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${watch.id === selected.id ? "border-primary/50 bg-primary-soft text-ink" : "border-transparent text-ink hover:bg-elevated"}`}>
                <span className="block break-words text-sm font-semibold">{watch.market.category} · {watch.market.locality}</span>
                <span className="mt-1 block text-sm text-muted">{watch.market.radius / 1000} km{watch.demo ? " · Example market" : ""}</span>
              </button>
            </li>)}
          </ul>
        </section>
        <article className="min-w-0 rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-6">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div className="min-w-0"><h2 className="break-words text-xl font-semibold tracking-tight text-ink">{selected.market.category}</h2><p className="mt-1 break-words text-sm text-muted">{selected.resolvedLocality} · {selected.market.radius / 1000} km radius{selected.demo ? " · Example market" : ""}</p></div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={recheck.isPending || remove.isPending} onClick={() => recheck.mutate(selected.id)}><RefreshCw className={`size-4 ${recheck.isPending && recheck.variables === selected.id ? "animate-spin" : ""}`} aria-hidden="true" />{recheck.isPending && recheck.variables === selected.id ? "Checking…" : "Recheck market"}</Button>
              <Button type="button" size="sm" variant="ghost" disabled={recheck.isPending || remove.isPending} aria-label="Remove watchlist" onClick={() => { remove.reset(); setRemoving(selected); }}><Trash2 className="size-4" aria-hidden="true" /></Button>
            </div>
          </header>
          {recheck.error && recheck.variables === selected.id && <p role="alert" className="mb-4 text-sm text-danger">{recheck.error.message}</p>}
          <WatchReport key={selected.id} watch={selected} canCapture={!selected.demo && !user?.isDemo} savedIds={savedIds} onCapture={capture} />
        </article>
      </div>}
    <Dialog open={Boolean(removing)} onClose={() => { if (!remove.isPending) setRemoving(null); }} title="Remove this watchlist?">
      <p className="text-sm text-muted">{removing?.market.category} · {removing?.market.locality}</p>
      {remove.error && <p role="alert" className="mt-3 text-sm text-danger">{remove.error.message}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" disabled={remove.isPending} onClick={() => setRemoving(null)}>Cancel</Button><Button type="button" disabled={remove.isPending} onClick={() => { if (removing) remove.mutate(removing.id); }}>{remove.isPending ? "Removing…" : "Remove"}</Button></div>
    </Dialog>
  </div>;
}
