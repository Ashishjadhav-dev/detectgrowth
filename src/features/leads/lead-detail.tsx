"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Building2, ClipboardCopy, Globe2, Mail, MapPin, Phone, ScanLine, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { promoteSavedLead } from "@/lib/api/leads";
import { canCaptureLead, leadContact, opportunityFor, outreachFor } from "@/lib/leads";
import { leadStatuses, type LocalLead, type SavedLead, type WebsiteAudit } from "@/types/leads";

type Props = {
  lead: LocalLead;
  saved?: SavedLead;
  audit?: WebsiteAudit;
  pending?: "capture" | "check";
  onCheck: () => Promise<void>;
  onSave: (save: boolean) => Promise<void>;
  onUpdate: (changes: Partial<Pick<SavedLead, "status" | "notes">>) => Promise<void>;
  isGuest: boolean;
};

export function LeadDetail({ lead, saved, audit, pending, onCheck, onSave, onUpdate, isGuest }: Props) {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const auditMutation = useMutation({ mutationFn: onCheck });
  const saveMutation = useMutation({ mutationFn: onSave, onSuccess: () => setNotes(null) });
  const updateMutation = useMutation({ mutationFn: onUpdate, onSuccess: (_, changes) => { if (changes.notes !== undefined) setNotes(null); } });
  const promoteMutation = useMutation({ mutationFn: () => promoteSavedLead(lead.id) });
  const signal = opportunityFor(lead, audit);
  const suggestedDraft = outreachFor(lead, audit);
  const maySave = canCaptureLead(lead, isGuest);
  const { phone, email } = leadContact(lead);

  async function copyDraft() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(draft ?? suggestedDraft);
      showToast("Outreach draft copied.");
    } catch {
      setCopyError("Select the text in the draft to copy it.");
    }
  }

  return <article className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
    <header className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">{lead.category}</p>
          <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-ink">{lead.name}</h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{lead.address || lead.locality}</p>
        </div>
        {maySave && <Button type="button" variant={saved ? "secondary" : "primary"} aria-pressed={Boolean(saved)} className="shrink-0" disabled={Boolean(pending) || auditMutation.isPending || updateMutation.isPending || promoteMutation.isPending} onClick={() => saveMutation.mutate(!saved)}>
          <Bookmark className={saved ? "size-4 fill-current" : "size-4"} aria-hidden="true" />{pending === "capture" ? "Saving…" : saved ? "Saved" : "Save lead"}
        </Button>}
      </div>
      {saveMutation.error && <p role="alert" className="mt-3 text-sm text-danger">{saveMutation.error.message}</p>}
      <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
        {phone && <a className="flex min-w-0 items-center gap-2 rounded-lg bg-elevated px-3 py-2.5 text-ink hover:underline" href={`tel:${phone}`}><Phone className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="break-all">{lead.phone}</span></a>}
        {email && <a className="flex min-w-0 items-center gap-2 rounded-lg bg-elevated px-3 py-2.5 text-ink hover:underline" href={`mailto:${email}`}><Mail className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="break-all">{email}</span></a>}
        {lead.website && <a className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2.5 text-ink hover:underline" href={lead.website} target="_blank" rel="noreferrer"><Globe2 className="size-4 shrink-0 text-primary" aria-hidden="true" />Business website</a>}
        {lead.mapsUrl && <a className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2.5 text-ink hover:underline" href={lead.mapsUrl} target="_blank" rel="noreferrer"><MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />{lead.source === "OpenStreetMap" ? "OpenStreetMap listing" : "Google Maps listing"}</a>}
      </div>
      {!phone && !email && !lead.nameIndexOnly && <p className="mt-3 text-sm text-muted">No phone or email appears in the source listing.</p>}
    </header>
    <div className="space-y-6 border-t border-border p-5 sm:p-6">
      <section className="rounded-xl bg-primary-soft/70 p-4">
        <div className="flex items-start justify-between gap-4">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" aria-hidden="true" />{signal.observation}</p><p className="mt-2 text-sm leading-6 text-ink">{signal.reason}</p></div>
          <div className="shrink-0 text-right"><p className="text-2xl font-semibold tabular-nums text-primary">{signal.score}<span className="text-xs font-medium">/100</span></p><p className="text-xs text-muted">Priority</p></div>
        </div>
      </section>
      {lead.website && <>
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Website evidence</h3>
            <Button type="button" variant="secondary" size="sm" disabled={auditMutation.isPending || Boolean(pending)} onClick={() => auditMutation.mutate()}><ScanLine className="size-4" aria-hidden="true" />{auditMutation.isPending ? "Checking website…" : audit ? "Check again" : "Run website check"}</Button>
          </div>
          {auditMutation.error && <p role="alert" className="mt-3 text-sm text-danger">{auditMutation.error.message}</p>}
          {audit ? <><p className="mt-2 text-sm text-muted">Checked <time dateTime={audit.checkedAt}>{new Date(audit.checkedAt).toLocaleString()}</time></p><ul className="mt-3 grid list-inside list-disc gap-2 text-sm text-muted sm:grid-cols-2" aria-live="polite">{audit.changeSignals.map((item) => <li key={item}>{item}</li>)}</ul></> : <p className="mt-2 text-sm text-muted">Check the homepage response, HTTPS, and basic metadata.</p>}
        </section>
      </>}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-ink">Outreach draft</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => void copyDraft()}><ClipboardCopy className="size-4" aria-hidden="true" />Copy draft</Button>
        </div>
        <textarea aria-label="Outreach draft" className="mt-3 min-h-44 w-full resize-y rounded-xl border border-border bg-elevated p-3 text-sm leading-6 text-ink" value={draft ?? suggestedDraft} onChange={(event) => setDraft(event.target.value)} />
        {copyError && <p role="alert" className="mt-2 text-sm text-danger">{copyError}</p>}
        {draft !== null && (draft !== suggestedDraft) && <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>Use suggested draft</Button>}
      </section>
      {saved && <section className="border-t border-border pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-ink">Lead stage
            <select className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-normal" value={saved.status} disabled={updateMutation.isPending || Boolean(pending)} onChange={(event) => updateMutation.mutate({ status: event.target.value as SavedLead["status"] })}>
              {leadStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          {!isGuest && (promoteMutation.data
            ? <Button asChild variant="secondary"><Link href={`/opportunities/${promoteMutation.data.id}`}>Open opportunity</Link></Button>
            : <Button type="button" variant="secondary" disabled={promoteMutation.isPending || updateMutation.isPending || Boolean(pending) || auditMutation.isPending} onClick={() => promoteMutation.mutate()}><Building2 className="size-4" aria-hidden="true" />{promoteMutation.isPending ? "Adding…" : "Add to opportunities"}</Button>)}
        </div>
        <form className="mt-4" onSubmit={(event) => { event.preventDefault(); if (notes !== null) updateMutation.mutate({ notes }); }}>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">Lead notes
            <textarea className="min-h-24 w-full resize-y rounded-xl border border-border bg-white p-3 font-normal" value={notes ?? saved.notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} />
          </label>
          <Button className="mt-2" size="sm" variant="secondary" disabled={notes === null || notes === saved.notes || Boolean(pending) || updateMutation.isPending}>Save notes</Button>
        </form>
        {updateMutation.error && <p role="alert" className="mt-2 text-sm text-danger">{updateMutation.error.message}</p>}
        {promoteMutation.error && <p role="alert" className="mt-2 text-sm text-danger">{promoteMutation.error.message}</p>}
      </section>}
    </div>
  </article>;
}
