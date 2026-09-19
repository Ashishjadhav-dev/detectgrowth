"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Search, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Score } from "@/components/ui/score";
import { listOpportunities, type ApiOpportunity } from "@/lib/api/opportunities";
import { demoOpportunities } from "@/data/demo";

export function OpportunitiesView() {
  const [query, setQuery] = useState(""); const [opportunities, setOpportunities] = useState<ApiOpportunity[]>([]);
  useEffect(() => { let cancelled = false; listOpportunities(query).then((data) => { if (!cancelled) setOpportunities(data); }).catch(() => { if (!cancelled) setOpportunities(demoOpportunities); }); return () => { cancelled = true; }; }, [query]);
  return <div className="space-y-5">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Pipeline</div><h1 className="page-title mt-2">Growth opportunities</h1><p className="mt-1 text-sm text-muted">Review live opportunities stored in your workspace and move them through the pipeline.</p></div><Button><Target className="size-4" />Create opportunity</Button></section>
    <Card className="glass-card p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="flex-1"><SearchInput value={query} onChange={setQuery} onClear={() => setQuery("")} placeholder="Search companies, industries, or stages…" /></div><Button variant="secondary"><Search className="size-4" />Search</Button></div></Card>
    <Card className="glass-card overflow-hidden">{opportunities.length ? <div className="overflow-x-auto"><table className="min-w-[760px] w-full border-collapse"><thead className="bg-elevated text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle"><tr><th className="table-cell">Company</th><th className="table-cell">Industry</th><th className="table-cell">Stage</th><th className="table-cell">Score</th><th className="table-cell">Status</th><th className="table-cell" /></tr></thead><tbody>{opportunities.map((opportunity) => <tr key={opportunity.id} className="border-t border-border/80 hover:bg-elevated/60"><td className="table-cell"><Link href={`/opportunities/${opportunity.id}`} className="font-semibold text-ink hover:text-primary">{opportunity.company || "Unassigned company"}</Link><div className="text-xs text-muted">{opportunity.location || "—"}</div></td><td className="table-cell text-muted">{opportunity.industry || "—"}</td><td className="table-cell"><Badge className="bg-primary-soft text-primary">{opportunity.stage}</Badge></td><td className="table-cell"><Score value={opportunity.score} compact /></td><td className="table-cell text-muted">{opportunity.status || "open"}</td><td className="table-cell"><Link href={`/opportunities/${opportunity.id}`} aria-label="Open opportunity"><ArrowUpRight className="size-4 text-primary" /></Link></td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="No opportunities yet" body="Create an opportunity or import signals to start building your pipeline." /></div>}</Card>
  </div>;
}
