"use client";
import { useState } from "react";
import { ShieldCheck, Sparkles, Search, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { SectionHeader } from "@/components/ui/patterns";
import { runResearch, type ResearchResult } from "@/lib/api/research";

const prompts = ["Market Position", "SWOT Analysis", "Sales Approach", "Pain Points", "Growth Potential"];

export function ResearchView() {
  const [query, setQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0]);
  const [hasRun, setHasRun] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">AI Research</div>
          <h1 className="page-title mt-2">Research workspace</h1>
          <p className="mt-1 text-sm text-muted">Generate structured company research with citations, prompts, and follow-up actions.</p>
        </div>
        <Button variant="secondary">
          <ShieldCheck className="size-4" />
          Citation mode
        </Button>
      </section>

      <Card className="glass-card p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <SearchInput value={query} onChange={setQuery} onClear={() => setQuery("")} placeholder="Enter company name to research..." />
          </div>
          <Button
            onClick={() => {
              if (query.trim()) { setLoading(true); setError(null); runResearch(query).then((data) => { setResult(data); setHasRun(true); }).catch((requestError: Error) => setError(requestError.message)).finally(() => setLoading(false)); }
            }}
          >
            <Wand2 className="size-4" />
            {loading ? "Loading evidence…" : "Start research"}
          </Button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <SectionHeader title="Research prompts" description="Choose a direction or run the agent with a company name." />
            {prompts.map((prompt, index) => (
              <button
                key={prompt}
                onClick={() => setSelectedPrompt(prompt)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm ${
                  selectedPrompt === prompt ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted hover:text-ink"
                }`}
              >
                <span>{prompt}</span>
                <Search className="size-4" />
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(result?.evidence.length ? result.evidence.slice(0, 4).map((item) => [item.title, item.description || `${item.impact} impact · ${item.confidence}% confidence`] as [string, string]) : [["Live evidence", "Run research against a company already stored in PostgreSQL."], ["Sources", "External source links are preserved when the signal worker has them."]]).map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Sparkles className="size-4 text-primary" />
                  {title}
                </div>
                <div className="mt-2 text-sm leading-6 text-muted">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-dashed border-border bg-elevated p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">{hasRun && result ? `Research ready for ${result.company.name}` : "Start a research report"}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
            {error ? error : hasRun && result ? `${selectedPrompt}: ${result.evidence.length} evidence records loaded at ${new Date(result.generatedAt).toLocaleString()}.` : "Results are loaded from your workspace company and signal records."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["Market Position", "SWOT Analysis", "Sales Approach", "Pain Points", "Growth Potential"].map((item) => (
              <button
                key={item}
                onClick={() => setSelectedPrompt(item)}
                className={`rounded-2xl border px-3 py-2 text-sm ${selectedPrompt === item ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
          {result?.evidence.length ? <div className="mt-5 space-y-2 text-left"><div className="text-sm font-semibold text-ink">Evidence timeline</div>{result.evidence.map((item) => <div key={item.id} className="rounded-2xl border border-border bg-white p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-ink">{item.title}</span><span className="text-xs text-muted">{item.confidence}% confidence</span></div><p className="mt-1 text-sm text-muted">{item.description || "No description provided."}</p>{item.sourceUrl && <a className="mt-1 block truncate text-xs text-primary" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceUrl}</a>}</div>)}</div> : null}
        </div>
      </Card>
    </div>
  );
}
