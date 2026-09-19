"use client";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
export function SaveJob({ id, title }: { id: string; title: string }) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  useEffect(() => { let cancelled = false; setSavedId(null); apiRequest<{ id: string; jobId: string }[]>("/api/v1/bookmarks").then((rows) => { if (!cancelled) setSavedId(rows.find((row) => row.jobId === id)?.id ?? null); }).catch(() => {}); return () => { cancelled = true; }; }, [id]);
  return <Button variant="secondary" size="sm" disabled={busy} aria-pressed={Boolean(savedId)} onClick={async () => {
    setBusy(true);
    try {
      if (savedId) { await apiRequest(`/api/v1/bookmarks/${savedId}`, { method: "DELETE" }); setSavedId(null); }
      else { const record = await apiRequest<{ id: string }>("/api/v1/bookmarks", { method: "POST", body: JSON.stringify({ jobId: id, title }) }); setSavedId(record.id); }
      showToast(savedId ? "Job removed from saved records" : "Job saved");
    } catch { showToast("Unable to save this job. Please retry."); }
    finally { setBusy(false); }
  }}><Bookmark className="size-4" />{busy ? "Saving…" : savedId ? "Saved" : "Save"}</Button>;
}
