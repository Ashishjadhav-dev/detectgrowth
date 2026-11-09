"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Globe2, MapPin, Phone, Search, Sparkles, Star, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadStatus, LeadsResponse, LocalLead } from "@/types/leads";

const statuses: LeadStatus[] = ["New", "Contacted", "Interested", "Won", "Not interested"];

function pitchFor(lead: LocalLead) {
  return `Hi ${lead.name} team, I found your business while looking at ${lead.category} businesses in ${lead.locality}. I noticed an opportunity to improve how local customers discover and contact you online. I build fast, mobile-first websites tailored to ${lead.category} businesses, with clear services, WhatsApp/contact actions, local SEO, and an easy update workflow. Would you be open to a quick 10-minute conversation about what could improve your online presence?`;
}

export function LeadsView() {
  const [locality, setLocality] = useState("Indiranagar, Bengaluru");
  const [category, setCategory] = useState("dental clinics");
  const [submitted, setSubmitted] = useState({ locality: "Indiranagar, Bengaluru", category: "dental clinics" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusesById, setStatusesById] = useState<Record<string, LeadStatus>>({});
  const [auditsById, setAuditsById] = useState<Record<string, NonNullable<LocalLead["audit"]>>>({});
  const [pitchCopied, setPitchCopied] = useState(false);
  const leadsQuery = useQuery<LeadsResponse, Error>({
    queryKey: ["leads", submitted],
    queryFn: async () => {
      const params = new URLSearchParams(submitted);
      const response = await fetch(`/api/leads?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load local businesses");
      return response.json() as Promise<LeadsResponse>;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
  const leads = useMemo(() => leadsQuery.data?.leads ?? [], [leadsQuery.data?.leads]);
  const selectedBase = leads.find((lead) => lead.id === selectedId) ?? leads[0];
  const selected = selectedBase ? { ...selectedBase, audit: auditsById[selectedBase.id] } : undefined;
  const selectedStatus = selected ? statusesById[selected.id] ?? selected.status : "New";
  const withWebsite = useMemo(() => leads.filter((lead) => lead.website).length, [leads]);
  const search = () => { setSubmitted({ locality: locality.trim(), category: category.trim() }); setSelectedId(null); };
  const audit = async (lead: LocalLead) => {
    if (!lead.website) return;
    const response = await fetch(`/api/leads/audit?url=${encodeURIComponent(lead.website)}`);
    if (!response.ok) return;
    const result = await response.json();
    setAuditsById((current) => ({ ...current, [lead.id]: result }));
  };

  return <div className="-mx-4 -my-4 flex min-h-[calc(100vh-4rem)] flex-col bg-[#fbfcfa] md:-mx-6 md:-my-6 lg:-mx-7 lg:-my-7 lg:h-[calc(100vh-4.25rem)] lg:overflow-hidden">
    <section className="border-b border-border bg-white px-5 py-7 md:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary"><Target className="size-3.5" /> Local lead discovery</div><h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Find businesses you can help grow</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Discover public business contacts, identify website opportunities, and turn each lead into a relevant outreach plan.</p></div><div className="flex gap-6 text-right"><div><div className="text-2xl font-semibold text-ink">{leads.length}</div><div className="text-xs text-muted">Businesses</div></div><div><div className="text-2xl font-semibold text-ink">{withWebsite}</div><div className="text-xs text-muted">With website</div></div></div></div><div className="mt-6 grid gap-3 rounded-2xl border border-border bg-[#fbfcfa] p-3 md:grid-cols-[1fr_1fr_auto]"><label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3"><MapPin className="size-4 text-muted" /><input value={locality} onChange={(event) => setLocality(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} aria-label="Locality" placeholder="Locality or city" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3"><Search className="size-4 text-muted" /><input value={category} onChange={(event) => setCategory(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} aria-label="Vendor category" placeholder="Vendor type, e.g. salons" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><Button onClick={search} className="h-11 px-5"><Search className="size-4" />Find leads</Button></div></div></section>
    <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8 lg:px-10"><div className="mx-auto grid max-w-7xl gap-5 lg:h-full lg:grid-cols-[minmax(320px,430px)_minmax(0,1fr)]">{leadsQuery.isLoading ? <><div className="space-y-3">{[1, 2, 3, 4].map((item) => <Card key={item} className="p-4"><div className="flex gap-3"><Skeleton className="size-11 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-full" /></div></div></Card>)}</div><Card className="hidden p-8 lg:block"><Skeleton className="h-6 w-1/2" /><Skeleton className="mt-4 h-4 w-full" /><Skeleton className="mt-2 h-4 w-4/5" /></Card></> : leadsQuery.error ? <Card className="p-8 text-center"><p className="font-semibold text-ink">Unable to load leads</p><p className="mt-2 text-sm text-muted">{leadsQuery.error.message}</p><Button className="mt-4" onClick={() => void leadsQuery.refetch()}>Try again</Button></Card> : !leads.length ? <Card className="p-12 text-center"><Globe2 className="mx-auto size-8 text-primary" /><h2 className="mt-4 font-semibold text-ink">No businesses found</h2><p className="mt-2 text-sm text-muted">Try a broader locality or category.</p></Card> : <><div className="min-w-0 space-y-3 lg:overflow-y-auto lg:pr-2"><div className="flex items-center justify-between px-1"><h2 className="text-sm font-semibold text-ink">Potential leads</h2><span className="text-xs text-muted">{leads.length} found</span></div>{leads.map((lead) => <button key={lead.id} type="button" onClick={() => setSelectedId(lead.id)} className={`w-full rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm ${selected?.id === lead.id ? "border-primary/40 bg-primary-soft/30" : "border-border"}`}><div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-elevated text-sm font-semibold text-primary">{lead.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate font-semibold text-ink">{lead.name}</h3><Badge className="shrink-0 border-border bg-elevated text-muted">{statusesById[lead.id] ?? lead.status}</Badge></div><p className="mt-1 text-xs text-muted">{lead.category} · {lead.locality}</p><p className="mt-2 truncate text-xs text-muted">{lead.address}</p></div></div><div className="mt-3 flex items-center justify-between text-xs text-muted"><span>{lead.website ? "Website found" : "No website listed"}</span>{lead.rating ? <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" />{lead.rating} ({lead.reviewCount})</span> : null}</div></button>)}</div><div className="hidden min-w-0 lg:block lg:overflow-y-auto">{selected ? <LeadDetail lead={selected} status={selectedStatus} onStatusChange={(status) => setStatusesById((current) => ({ ...current, [selected.id]: status }))} onAudit={() => void audit(selected)} pitchCopied={pitchCopied} onCopyPitch={() => { void navigator.clipboard.writeText(pitchFor(selected)); setPitchCopied(true); window.setTimeout(() => setPitchCopied(false), 1800); }} /> : null}</div></>}</div></main>
  </div>;
}

function LeadDetail({ lead, status, onStatusChange, onAudit, pitchCopied, onCopyPitch }: { lead: LocalLead; status: LeadStatus; onStatusChange: (status: LeadStatus) => void; onAudit: () => void; pitchCopied: boolean; onCopyPitch: () => void }) {
  return <Card className="overflow-hidden border-border bg-white"><div className="border-b border-border bg-white p-6"><div className="flex items-start justify-between gap-4"><div><Badge className="border-primary/15 bg-primary-soft text-primary">{lead.source}</Badge><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{lead.name}</h2><p className="mt-1 text-sm text-muted">{lead.category} · {lead.locality}</p></div><a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="rounded-xl p-2 text-muted hover:bg-elevated" aria-label="Open map"><ExternalLink className="size-5" /></a></div><div className="mt-5 grid gap-2 text-sm text-muted"><span className="flex items-center gap-2"><MapPin className="size-4" />{lead.address}</span>{lead.phone ? <span className="flex items-center gap-2"><Phone className="size-4" />{lead.phone}</span> : null}{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe2 className="size-4" />{lead.website}</a> : <span className="flex items-center gap-2 text-amber-700"><Globe2 className="size-4" />No public website found</span>}</div><div className="mt-5 flex flex-wrap gap-2"><select value={status} onChange={(event) => onStatusChange(event.target.value as LeadStatus)} aria-label="Lead status" className="h-9 rounded-xl border border-border bg-white px-3 text-xs font-medium text-ink">{statuses.map((item) => <option key={item}>{item}</option>)}</select>{lead.website ? <Button variant="secondary" size="sm" onClick={onAudit}>Audit website</Button> : null}<Button size="sm" onClick={onCopyPitch}><Sparkles className="size-4" />{pitchCopied ? "Copied" : "Copy pitch"}</Button></div></div><div className="space-y-5 p-6"><section><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Why this is a lead</h3><p className="mt-2 text-sm leading-6 text-muted">{lead.website ? "Review the current site for conversion, mobile, local SEO, and contact-flow improvements." : "No public website is listed, so a simple mobile-first local business site may be a strong opportunity."}</p></section>{lead.audit ? <section className="rounded-2xl border border-border bg-[#fbfcfa] p-4"><h3 className="text-sm font-semibold text-ink">Website audit</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{lead.audit.changeSignals.map((signal) => <p key={signal} className="text-xs text-muted">• {signal}</p>)}</div></section> : null}<section className="rounded-2xl border border-primary/15 bg-primary-soft/25 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles className="size-4 text-primary" />Suggested pitch</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{pitchFor(lead)}</p></section></div></Card>;
}
