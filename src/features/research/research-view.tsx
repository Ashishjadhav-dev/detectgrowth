"use client";
import { useEffect, useState } from "react";
import { runResearch, type ResearchResult } from "@/lib/api/research";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export function ResearchView() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setQuery(new URLSearchParams(window.location.search).get("query") ?? ""); }, []);
  const search = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { setResult(await runResearch(query)); }
    catch (error) { setResult(null); setError(error instanceof Error ? error.message : "Unable to research this company."); }
    finally { setBusy(false); }
  };
  return <div className="min-w-0 space-y-5"><div><h1 className="page-title">Company research</h1><p className="mt-2 text-sm text-muted">Review company information and signal evidence from your workspace.</p></div>
    <Card className="p-5"><form onSubmit={search} className="flex flex-col gap-3 sm:flex-row"><Input required aria-label="Company name" placeholder="Company name" value={query} onChange={(event) => setQuery(event.target.value)} /><Button disabled={busy}>{busy ? "Researching…" : "Start research"}</Button></form><div className="mt-4 flex flex-wrap gap-2">{["ABC Fashion", "LMN Solutions", "PQR Electronics"].map((name) => <button className="rounded-full border border-border px-3 py-2 text-xs text-primary" key={name} onClick={() => setQuery(name)}>{name}</button>)}</div></Card>
    {error ? <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">{error}</p> : null}
    {result ? <><Card className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="section-title">{result.company.name}</h2><p className="mt-2 text-sm text-muted">{result.company.industry} · {result.company.location}</p></div><Button variant="secondary" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = "research.json"; link.click(); URL.revokeObjectURL(url); }}>Export report</Button></div></Card><div className="grid min-w-0 gap-4 md:grid-cols-2">{result.evidence.map((item) => <Card key={item.id} className="p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm text-muted">{item.description}</p><p className="mt-3 text-xs text-muted">{item.impact} impact · {item.confidence}% confidence</p>{item.sourceUrl ? <a href={item.sourceUrl} rel="noreferrer" target="_blank" className="mt-3 inline-block text-sm text-primary">View source</a> : null}</Card>)}</div>{!result.evidence.length ? <Card className="p-6 text-center text-sm text-muted">No signal evidence recorded for this company yet.</Card> : null}</> : !busy && !error ? <Card className="p-8 text-center"><h2 className="font-semibold">Start a research report</h2><p className="mt-2 text-sm text-muted">Enter a company name or choose an example above.</p></Card> : null}
  </div>;
}
