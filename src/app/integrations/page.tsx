"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { listIntegrations, updateIntegration, type ApiIntegration } from "@/lib/api/integrations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
export default function Page() {
  const [items, setItems] = useState<ApiIntegration[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = async () => { setBusy("refresh"); setError(""); try { const [data] = await Promise.all([listIntegrations(), new Promise((resolve) => setTimeout(resolve, 650))]); setItems(data); } catch { setError("Unable to refresh sources. Please try again."); } finally { setBusy(""); } };
  useEffect(() => { void load(); }, []);
  if (!items && !error) return <PageSkeleton />;
  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="page-title">Integrations</h1><p className="mt-2 text-sm text-muted">Manage the data sources enabled in your workspace.</p></div><Button variant="secondary" disabled={Boolean(busy)} onClick={load}><RefreshCw className={busy === "refresh" ? "size-4 animate-spin" : "size-4"} />Refresh statuses</Button></div>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items?.map((item) => <Card key={item.provider} className="p-5"><h2 className="font-semibold">{item.name}</h2><p className="mt-2 text-sm text-muted">{item.description}</p><p className="mt-4 text-xs text-muted">Workspace status: {item.status}</p><Button className="mt-4" variant="secondary" disabled={Boolean(busy)} onClick={async () => { setBusy(item.provider); setError(""); const status = item.status === "connected" ? "disabled" : "connected"; try { await updateIntegration(item.provider, status); setItems((current) => current?.map((row) => row.provider === item.provider ? { ...row, status } : row) ?? []); } catch { setError("Unable to update this source. Please retry."); } finally { setBusy(""); } }}>{busy === item.provider ? "Saving…" : item.status === "connected" ? "Disable source" : "Enable source"}</Button></Card>)}</div>
    {items?.length === 0 ? <Card className="p-8 text-center text-sm text-muted">No sources are configured for this workspace.</Card> : null}
  </div>;
}
