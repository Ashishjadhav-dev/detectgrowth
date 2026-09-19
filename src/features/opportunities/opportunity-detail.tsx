"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Download, MoreHorizontal, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Score } from "@/components/ui/score";
import { CompanyMark } from "@/components/companies/company-mark";
import { SectionHeader } from "@/components/ui/patterns";
import { getOpportunity, type ApiOpportunity } from "@/lib/api/opportunities";
import { demoOpportunities } from "@/data/demo";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const tabs = ["Overview", "Signals", "People", "Research", "Notes", "Activity"] as const;

export function OpportunityDetail({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview"); const [opportunity, setOpportunity] = useState<ApiOpportunity | null>(null);
  useEffect(() => { getOpportunity(id).then(setOpportunity).catch(() => { setOpportunity(demoOpportunities.find((item) => item.id === id) ?? demoOpportunities[0]); }); }, [id]);
  const signals = opportunity?.signals ?? [];
  if (!opportunity) return <PageSkeleton variant="detail" />;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary"><ArrowLeft className="size-4" />Back to opportunities</Link><div className="flex gap-2"><Button variant="secondary"><Bookmark className="size-4" />Save</Button><Button variant="secondary"><Download className="size-4" />Export</Button><Button variant="secondary" aria-label="More actions"><MoreHorizontal className="size-4" /></Button></div></div>
    <Card className="glass-card p-5"><div className="flex flex-wrap items-start gap-4"><CompanyMark name={opportunity?.company || "Opportunity"} /><div className="min-w-0 flex-1"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Opportunity 360</div><h1 className="page-title mt-2">{opportunity?.company || "Loading opportunity…"}</h1><p className="mt-1 text-sm text-muted">{opportunity?.industry || "—"} · {opportunity?.location || "—"}</p></div><div className="text-right"><Score value={opportunity?.score ?? 0} /><Badge className="mt-2 bg-primary-soft text-primary">{opportunity?.stage || "loading"}</Badge></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Signals", String(signals.length), "active signals"], ["Expected value", opportunity?.expectedValue ? `$${opportunity.expectedValue.toLocaleString()}` : "—", "estimated value"], ["Score", opportunity ? `${opportunity.score}/100` : "—", "growth fit"], ["Status", opportunity?.status || "—", "current state"]].map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-border bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</div><div className="mt-2 text-2xl font-semibold text-ink">{value}</div><div className="mt-1 text-xs text-muted">{hint}</div></div>)}</div>
    </Card>
    <div className="flex gap-6 overflow-x-auto border-b border-border text-sm">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-1 pb-3 ${activeTab === tab ? "border-primary font-semibold text-primary" : "border-transparent text-muted"}`}>{tab}</button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.4fr_.95fr]"><Card className="glass-card p-5"><SectionHeader title={`${activeTab} evidence`} description="Signals, context, and next steps for this opportunity." />{activeTab === "Overview" || activeTab === "Signals" ? <div className="mt-5 space-y-3">{signals.length ? signals.map((signal) => <div key={signal.id} className="rounded-2xl border border-border bg-white p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium text-ink">{signal.title}</div><Badge className="bg-primary-soft text-primary">{signal.impact}</Badge></div><p className="mt-1 text-sm text-muted">{signal.description || "No description provided."}</p><div className="mt-2 flex justify-between text-xs text-muted"><span>{new Date(signal.detectedAt).toLocaleString()}</span><span>{signal.confidence}% confidence</span></div>{signal.sourceUrl && <a className="mt-1 block truncate text-xs text-primary" href={signal.sourceUrl} target="_blank" rel="noreferrer">{signal.sourceUrl}</a>}</div>) : <EmptyState title="No signal evidence" body="There are no signals for this opportunity yet." />}</div> : <EmptyState title={`${activeTab} data`} body="No activity has been recorded for this view yet." />}<div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-sm font-semibold text-ink">Current score</span><span className="text-sm font-semibold text-primary">{opportunity?.score ?? 0}/100</span></div></Card><Card className="glass-card p-5"><SectionHeader title="Opportunity state" description="Current stage, status, and account context." /><div className="space-y-3">{[["Stage", opportunity?.stage || "—"], ["Status", opportunity?.status || "—"], ["Company", opportunity?.company || "—"], ["Employees", opportunity?.employees || "—"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-white p-3"><div className="text-xs uppercase tracking-[0.12em] text-subtle">{label}</div><div className="mt-1 text-sm font-medium text-ink">{value}</div></div>)}</div></Card></div>
    <Card className="glass-card p-5"><SectionHeader title="Next action" description="Keep momentum moving with a clear follow-up." /><div className="rounded-2xl border border-dashed border-border bg-elevated p-5 text-sm text-muted">{opportunity ? "Review the latest signal and assign the next customer touchpoint." : "Loading opportunity state…"}</div><Button className="mt-4"><Target className="size-4" />Update opportunity</Button></Card>
  </div>;
}
