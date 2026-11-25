import { Bookmark, Building2, Check, Globe2, Mail, Phone, Radar, Star } from "lucide-react";
import { leadContact, opportunityFor } from "@/lib/leads";
import type { LocalLead, SavedLead } from "@/types/leads";

type LeadResultProps = {
  lead: LocalLead;
  signal: ReturnType<typeof opportunityFor>;
  saved?: SavedLead;
  selected: boolean;
  canCapture: boolean;
  pending?: "capture" | "check";
  error?: string;
  onSelect: () => void;
  onCapture: () => void;
};

export function LeadResult({ lead, signal, saved, selected, canCapture, pending, error, onSelect, onCapture }: LeadResultProps) {
  const { phone, email } = leadContact(lead);
  return <li className={`overflow-hidden rounded-2xl border bg-white ${selected ? "border-primary/70 ring-1 ring-primary/20" : "border-border hover:border-primary/50"}`}>
    <button type="button" aria-pressed={selected} onClick={onSelect} className="block w-full rounded-xl p-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
      <span className="flex min-w-0 items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Building2 className="size-4" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block break-words font-semibold leading-tight text-ink">{lead.name}</span>
          <span className="mt-1 block break-words text-sm text-muted">{lead.address || lead.locality}</span>
        </span>
        <span className="shrink-0 rounded-lg bg-elevated px-2 py-1 text-center text-sm font-semibold tabular-nums text-ink" aria-label={`Priority ${signal.score} of 100`}>{signal.score}<span aria-hidden="true" className="block text-[11px] font-normal text-muted">Priority</span></span>
      </span>
      <span className={`mt-3 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium ${signal.kind === "research" ? "bg-elevated text-muted" : "bg-primary-soft text-primary"}`}>
        <Radar className="size-4 shrink-0" aria-hidden="true" />{signal.observation}
      </span>
    </button>
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border px-3.5 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {phone && <a className="inline-flex items-center gap-1 hover:text-primary hover:underline" href={`tel:${phone}`} aria-label={`Call ${lead.name}`}><Phone className="size-3.5" aria-hidden="true" />Phone</a>}
        {email && <a className="inline-flex items-center gap-1 hover:text-primary hover:underline" href={`mailto:${email}`} aria-label={`Email ${lead.name}`}><Mail className="size-3.5" aria-hidden="true" />Email</a>}
        {lead.website && <a className="inline-flex items-center gap-1 hover:text-primary hover:underline" href={lead.website} target="_blank" rel="noreferrer" aria-label={`Visit website for ${lead.name}`}><Globe2 className="size-3.5" aria-hidden="true" />Website</a>}
        {!phone && !email && <span>{lead.nameIndexOnly ? "Contact details unverified" : "No direct contact listed"}</span>}
        {lead.rating !== null && <span className="inline-flex items-center gap-1"><Star className="size-3" aria-hidden="true" />{lead.rating} ({lead.reviewCount})</span>}
      </div>
      {saved ? <span className="inline-flex min-h-8 items-center gap-1 rounded-md bg-primary-soft px-2 text-xs font-semibold text-primary" title="Saved to shortlist"><Check className="size-3.5" aria-hidden="true" />{saved.status === "New" ? "Captured" : saved.status}</span> :
        canCapture && <button type="button" disabled={Boolean(pending)} onClick={onCapture} aria-label={`Capture ${lead.name}`} className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary-soft disabled:opacity-60"><Bookmark className="size-3.5" aria-hidden="true" />{pending === "capture" ? "Capturing…" : "Capture"}</button>}
    </div>
    {error && <p role="alert" className="px-3.5 pb-3 text-sm text-danger">{error}</p>}
  </li>;
}
