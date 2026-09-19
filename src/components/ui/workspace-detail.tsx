"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { Button } from "./button";
import { Card } from "./card";
import { PageSkeleton } from "./page-skeleton";
import { useToast } from "./toast";

type Detail = { id: string; name?: string; company?: string; industry?: string; location?: string; stage?: string; score?: number; saved?: boolean; notes?: string; signals?: { id: string; type?: string; title?: string; description: string }[] };
export function WorkspaceDetail({ resource, id }: { resource: "companies" | "opportunities"; id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState("New");
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const { showToast } = useToast();
  const path = `/api/v1/${resource}/${encodeURIComponent(id)}`;
  useEffect(() => { let cancelled = false; setError(""); setData(null); apiRequest<Detail>(path).then((record) => { if (cancelled) return; setData(record); setNotes(record.notes ?? ""); setStage(record.stage ?? "New"); setScore(record.score ?? 0); }).catch((err) => { if (!cancelled) setError(err.message); }); return () => { cancelled = true; }; }, [path, retry]);
  const save = async (input: Partial<Detail>) => {
    setBusy(true); setError("");
    try { const record = await apiRequest<Detail>(path, { method: "PATCH", body: JSON.stringify(input) }); setData(record); showToast("Changes saved"); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save."); }
    finally { setBusy(false); }
  };
  const back = resource === "companies" ? "/discover" : "/opportunities";
  if (!data && !error) return <PageSkeleton variant="detail" />;
  return <div className="min-w-0 space-y-5"><Link className="text-sm text-primary" href={back}>← Back to {resource}</Link>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} <button className="underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></p> : null}
    {data ? <><Card className="min-w-0 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h1 className="page-title break-words">{data.name ?? data.company}</h1><p className="mt-2 text-sm text-muted">{data.industry || "Other"} · {data.location || "Location not specified"}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} aria-pressed={Boolean(data.saved)} onClick={() => save({ saved: !data.saved })}>{data.saved ? "Unsave" : "Save"}</Button><Button variant="secondary" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `${resource}-${id}.json`; link.click(); URL.revokeObjectURL(url); }}>Export</Button><Button asChild variant="secondary"><Link href={`/research?query=${encodeURIComponent(data.name ?? data.company ?? "")}`}>Research</Link></Button></div></div></Card>
    <div className="grid min-w-0 gap-5 lg:grid-cols-2"><Card className="p-5"><h2 className="section-title">Signal evidence</h2><div className="mt-4 space-y-3">{data.signals?.length ? data.signals.map((signal) => <div key={signal.id} className="rounded-xl border border-border p-3"><h3 className="text-sm font-medium">{signal.title ?? signal.type}</h3><p className="mt-1 text-sm text-muted">{signal.description}</p></div>) : <p className="text-sm text-muted">No signals recorded for this account.</p>}</div><Link className="mt-4 inline-block text-sm text-primary" href="/signals">Manage signals →</Link></Card>
    <Card className="p-5"><h2 className="section-title">Notes</h2><form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); void save({ notes }); }}><textarea aria-label="Account notes" maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record your next steps…" className="min-h-36 w-full rounded-xl border border-border p-3 text-sm" /><Button disabled={busy}>{busy ? "Saving…" : "Save notes"}</Button></form></Card></div>
    {resource === "opportunities" ? <Card className="p-5"><h2 className="section-title">Pipeline status</h2><form className="mt-4 flex flex-wrap items-end gap-4" onSubmit={(event) => { event.preventDefault(); void save({ stage, score }); }}><label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">Stage<select value={stage} onChange={(event) => setStage(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3">{["New", "Discovery", "Qualified", "Proposal", "Won", "Lost"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="flex flex-col gap-2 text-sm">Score<input required type="number" min={0} max={100} value={score} onChange={(event) => setScore(Number(event.target.value))} className="h-11 w-28 rounded-xl border border-border px-3" /></label><Button disabled={busy}>Update opportunity</Button></form></Card> : null}</> : null}
  </div>;
}
