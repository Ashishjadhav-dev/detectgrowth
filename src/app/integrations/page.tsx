"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plug, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/patterns";
import { listIntegrations, type ApiIntegration } from "@/lib/api/integrations";
import { demoIntegrations } from "@/data/demo";

export default function Page() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]); const [error, setError] = useState("");
  const load = () => listIntegrations().then(setIntegrations).catch(() => { setIntegrations(demoIntegrations); setError("Showing demo connector statuses while the API is unavailable."); });
  useEffect(() => { load(); }, []);
  return <div className="space-y-5"><div><h1 className="page-title">Integrations</h1><p className="mt-1 text-sm text-muted">Public data connectors work without paid enrichment. OAuth providers require your own approved application credentials.</p></div><Card className="glass-card p-5"><SectionHeader title="Data sources" description="Live status is read from the backend connection registry and worker heartbeat." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{integrations.map((integration) => { const active = integration.status === "connected"; return <div key={integration.provider} className="rounded-2xl border border-border bg-white p-4"><div className="flex items-center justify-between gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary"><Plug className="size-4" /></div><CheckCircle2 className={`size-4 ${active ? "text-success" : "text-subtle"}`} /></div><div className="mt-4 text-sm font-medium text-ink">{integration.name}</div><div className="mt-1 text-xs text-muted">{integration.description}</div><div className="mt-4 flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-medium ${active ? "bg-emerald-50 text-success" : "bg-elevated text-muted"}`}>{integration.status.replace("_", " ")}</span>{integration.lastSyncedAt && <span className="text-[11px] text-muted">{new Date(integration.lastSyncedAt).toLocaleString()}</span>}</div>{integration.kind === "oauth" && <div className="mt-3 text-xs text-warning">Requires OAuth setup; no credentials are bundled.</div>}</div>; })}</div>{error && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}<Button variant="secondary" className="mt-4" onClick={load}><RefreshCw className="size-4" />Refresh statuses</Button></Card></div>;
}
