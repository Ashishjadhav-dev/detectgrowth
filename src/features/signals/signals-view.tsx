"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { SectionHeader } from "@/components/ui/patterns";
import { listSignals, type ApiSignal } from "@/lib/api/signals";
import { demoSignals } from "@/data/demo";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

const filters = ["All", "High", "Medium", "Low"] as const;

export function SignalsView() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [apiSignals, setApiSignals] = useState<ApiSignal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertName, setAlertName] = useState("");
  const { showToast } = useToast();
  useEffect(() => {
    setLoading(true);
    listSignals(query).then((data) => { setApiSignals(data); setLoading(false); }).catch(() => { setApiSignals(demoSignals); setLoading(false); });
  }, [query]);
  if (loading && !apiSignals) return <PageSkeleton variant="results" />;
  const normalized = query.trim().toLowerCase();

  const filtered = (apiSignals ?? []).filter((signal) => {
    const matchesQuery =
      !normalized ||
      [signal.type, signal.company, signal.description, signal.impact, String(signal.confidence)].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    const matchesFilter = activeFilter === "All" || signal.impact === activeFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Signals</div>
          <h1 className="page-title mt-2">Live growth and intent signals</h1>
          <p className="mt-1 text-sm text-muted">Review recent events, confidence, and the recommended next action in one pass.</p>
        </div>
        <Button onClick={() => setAlertOpen(true)}>Create alert</Button>
      </section>

      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)} title="Create signal alert" description="Get a reminder when matching growth signals appear."><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!alertName.trim()) return; showToast(`Alert “${alertName.trim()}” created`); setAlertName(""); setAlertOpen(false); }}><label className="block"><span className="mb-2 block text-sm font-medium text-ink">Alert name</span><input autoFocus required value={alertName} onChange={(event) => setAlertName(event.target.value)} placeholder="High intent accounts" className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /></label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setAlertOpen(false)}>Cancel</Button><Button type="submit">Create alert</Button></div></form></Dialog>

      <Card className="glass-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <SearchInput value={query} onChange={setQuery} onClear={() => setQuery("")} placeholder="Search signals, companies, descriptions..." />
          </div>
          <Button variant="secondary" onClick={() => setActiveFilter("All")}>
            Reset
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-3 py-2 text-sm ${
                activeFilter === filter ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted hover:text-ink"
              }`}
            >
              {filter}
            </button>
          ))}
          <div className="ml-auto text-sm text-muted">{filtered.length} signals</div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="glass-card overflow-hidden">
          {filtered.length > 0 ? (
            <div className="divide-y divide-border">
              {filtered.map((signal) => (
                <div key={signal.id} className="grid gap-3 p-4 transition hover:bg-elevated md:grid-cols-[1.1fr_1.3fr_.8fr_.65fr_.5fr]">
                  <div>
                    <div className="text-sm font-semibold text-ink">{signal.type}</div>
                    <div className="mt-1 text-xs text-muted">{signal.company}</div>
                  </div>
                  <div className="text-sm leading-6 text-muted">{signal.description}</div>
                  <div className="text-sm text-muted">{signal.time}</div>
                  <div>
                    <Badge className={signal.impact === "High" ? "bg-emerald-50 text-success" : "bg-amber-50 text-warning"}>
                      {signal.impact} impact
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-primary">{signal.confidence}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No matching signals" body="Try a broader search or switch back to all severities." />
            </div>
          )}
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Signal evidence" description="Use this area for citations, timeline, and the follow-up action." />
          <div className="space-y-3">
            {[
              ["Evidence source", "Website changes, job boards, ads"],
              ["Confidence", "High and validated"],
              ["Recommended action", "Send the right contact a tailored note"],
              ["Follow-up", "Add to watchlist or sequence"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</div>
                <div className="mt-2 text-sm text-ink">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">
            This surface should eventually expose a timeline and citations for each signal.
          </div>
        </Card>
      </section>
    </div>
  );
}
