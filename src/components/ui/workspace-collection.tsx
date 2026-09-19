"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api/client";
import { Button } from "./button";
import { Card } from "./card";
import { Dialog } from "./dialog";
import { PageSkeleton } from "./page-skeleton";
import { useToast } from "./toast";

export type Field = { key: string; label: string; type?: "number" | "email"; options?: string[]; required?: boolean; max?: number };
type Row = Record<string, string | number | boolean> & { id: string };
export function WorkspaceCollection({ resource, title, description, fields, seed, detailPath }: {
  resource: string; title: string; description: string; fields: Field[]; seed: unknown[]; detailPath?: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { showToast } = useToast();
  const path = `/api/v1/${resource}`;
  useEffect(() => {
    let cancelled = false;
    apiRequest<Row[]>(path).then((data) => { if (!cancelled) { setRows(data); setError(""); } }).catch(() => {
      if (!cancelled) { setRows((existing) => existing ?? structuredClone(seed) as Row[]); setError("Unable to refresh. Your current records are still available."); }
    });
    return () => { cancelled = true; };
  // Resource configuration is static; refresh explicitly reloads the collection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, refresh]);
  const category = fields.find((field) => field.options);
  const visible = (rows ?? []).filter((row) => (!savedOnly || row.saved) && (!filter || row[category?.key ?? ""] === filter) && fields.some((field) => String(row[field.key] ?? "").toLowerCase().includes(query.toLowerCase().trim())));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<Row>(editing.id ? `${path}/${editing.id}` : path, { method: editing.id ? "PATCH" : "POST", body: JSON.stringify(editing) });
      setRows((current) => editing.id ? (current ?? []).map((row) => row.id === data.id ? data : row) : [data, ...(current ?? [])]);
      setEditing(null);
      showToast("Changes saved");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save. Please retry."); }
    finally { setBusy(false); }
  };
  const toggleSaved = async (row: Row) => {
    try {
      const data = await apiRequest<Row>(`${path}/${row.id}`, { method: "PATCH", body: JSON.stringify({ saved: !row.saved }) });
      setRows((current) => current?.map((item) => item.id === row.id ? data : item) ?? []);
      showToast(data.saved ? "Saved to your workspace" : "Removed from saved records");
    } catch { showToast("Unable to save. Please try again."); }
  };
  const exportCsv = () => {
    const quote = (value: unknown) => `"${String(value ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const csv = [fields.map((field) => quote(field.label)).join(","), ...visible.map((row) => fields.map((field) => quote(row[field.key])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${resource}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  if (!rows) return <PageSkeleton variant="results" />;
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-title">{title}</h1><p className="mt-2 text-sm text-muted">{description}</p></div><Button onClick={() => { setError(""); setEditing(Object.fromEntries(fields.map((field) => [field.key, field.options?.[0] ?? ""]))); }}>Create {resource === "people" ? "contact" : resource === "opportunities" ? "opportunity" : resource.slice(0, -1)}</Button></div>
    {error ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">{error} <button className="font-medium underline" onClick={() => setRefresh((value) => value + 1)}>Retry</button></div> : null}
    <Card className="min-w-0 p-4"><div className="flex flex-wrap gap-3"><input aria-label={`Search ${resource}`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${resource}…`} className="h-11 min-w-0 flex-1 rounded-xl border border-border px-3" />{category ? <select aria-label={`Filter by ${category.label}`} className="h-11 max-w-full rounded-xl border border-border bg-white px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All {category.label.toLowerCase()}</option>{category.options?.map((option) => <option key={option}>{option}</option>)}</select> : null}<Button variant="secondary" onClick={() => setSavedOnly((value) => !value)} aria-pressed={savedOnly}>{savedOnly ? "Show all" : "Saved only"}</Button><Button variant="secondary" onClick={exportCsv} disabled={!visible.length}>Export CSV</Button></div><p className="mt-3 text-xs text-muted" aria-live="polite">{visible.length} of {rows.length} records</p></Card>
    {!visible.length ? <Card className="p-8 text-center"><h2 className="font-semibold">No matching records</h2><p className="mt-2 text-sm text-muted">Create a record or adjust your filters.</p><Button variant="secondary" className="mt-4" onClick={() => { setQuery(""); setFilter(""); setSavedOnly(false); }}>Clear filters</Button></Card> : <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((row) => <Card key={row.id} className="min-w-0 p-5"><h2 className="break-words font-semibold text-ink">{detailPath ? <Link className="hover:text-primary" href={`${detailPath}/${row.id}`}>{String(row[fields[0].key] ?? "Untitled")}</Link> : String(row[fields[0].key] ?? "Untitled")}</h2><dl className="mt-4 space-y-2">{fields.slice(1).map((field) => <div key={field.key} className="flex min-w-0 justify-between gap-4 text-sm"><dt className="shrink-0 text-muted">{field.label}</dt><dd className="min-w-0 break-words text-right">{String(row[field.key] ?? "—")}</dd></div>)}</dl><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => { setError(""); setEditing(row); }}>Edit</Button><Button size="sm" variant="secondary" aria-pressed={Boolean(row.saved)} onClick={() => toggleSaved(row)}>{row.saved ? "Unsave" : "Save"}</Button><Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>Delete</Button></div></Card>)}</div>}
    <Dialog open={editing !== null} title={editing?.id ? "Edit record" : "Create record"} onClose={() => { if (!busy) setEditing(null); }}><form onSubmit={save} className="space-y-4">{fields.map((field) => <label key={field.key} className="block text-sm font-medium">{field.label}{field.options ? <select className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3" value={String(editing?.[field.key] ?? field.options[0])} onChange={(event) => setEditing((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input required={field.required} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} max={field.max} maxLength={field.type !== "number" ? 500 : undefined} className="mt-2 h-11 w-full rounded-xl border border-border px-3" value={String(editing?.[field.key] ?? "")} onChange={(event) => setEditing((current) => ({ ...current, [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value }))} />}</label>)}{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<Button disabled={busy} className="w-full">{busy ? "Saving…" : "Save changes"}</Button></form></Dialog>
    <Dialog open={deleting !== null} title="Delete record?" description="This removes the record from your workspace." onClose={() => { if (!busy) setDeleting(null); }}><Button disabled={busy} onClick={async () => { if (!deleting) return; setBusy(true); try { await apiRequest(`${path}/${deleting.id}`, { method: "DELETE" }); setRows((current) => current?.filter((row) => row.id !== deleting.id) ?? []); setDeleting(null); showToast("Record deleted"); } catch { showToast("Unable to delete. Please retry."); } finally { setBusy(false); } }}>{busy ? "Deleting…" : "Delete record"}</Button></Dialog>
  </div>;
}
