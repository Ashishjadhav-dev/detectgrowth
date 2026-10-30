"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createJobAlert, deleteJobAlert, listJobAlerts, updateJobAlert, type JobAlertPreference } from "@/lib/api/career";

type AlertPreferences = Omit<JobAlertPreference, "id"> & { id?: string };

export function JobAlert({ query, workplace }: { query: string; workplace: string }) {
  const [saved, setSaved] = useState<AlertPreferences | null>(null);
  const [frequency, setFrequency] = useState<AlertPreferences["frequency"]>("daily");
  const [message, setMessage] = useState("");
  useEffect(() => { listJobAlerts().then((alerts) => { const value = alerts[0]; if (value) { setSaved(value); setFrequency(value.frequency); window.localStorage.setItem("detectgrowth-job-alert", JSON.stringify(value)); } }).catch(() => { try { const value = JSON.parse(window.localStorage.getItem("detectgrowth-job-alert") ?? "null") as AlertPreferences | null; if (value) { setSaved(value); setFrequency(value.frequency); } } catch { /* Alert preferences are optional. */ } }); }, []);
  const save = async () => {
    const value = { query: query.trim() || "all roles", workplace, frequency, enabled: true } satisfies Omit<AlertPreferences, "id">;
    window.localStorage.setItem("detectgrowth-job-alert", JSON.stringify(value));
    const response = saved?.id ? await updateJobAlert(saved.id, value).catch(() => value) : await createJobAlert(value).catch(() => value);
    setSaved({ ...value, ...(typeof response === "object" && response && "id" in response ? response : {}) });
    setMessage("Alert preference saved in this workspace.");
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  };
  const clear = async () => { if (saved?.id) await deleteJobAlert(saved.id).catch(() => {}); window.localStorage.removeItem("detectgrowth-job-alert"); setSaved(null); setMessage("Alert removed."); };
  return <Card className="mx-4 mt-3 border-primary/15 bg-primary-soft/25 p-4 md:mx-6 lg:mx-7"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-primary"><Bell className="size-4" /></span><div><p className="text-sm font-semibold text-ink">Get notified about matching openings</p><p className="mt-1 text-xs text-muted">{saved ? `${saved.frequency === "daily" ? "Daily" : "Weekly"} alert · ${saved.query} · ${saved.workplace}` : "Save the current search as a personal job alert."}</p></div></div><div className="flex flex-wrap items-center gap-2"><select aria-label="Job alert frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as AlertPreferences["frequency"])} className="h-9 rounded-xl border border-border bg-white px-3 text-xs text-ink"><option value="daily">Daily</option><option value="weekly">Weekly</option></select><Button size="sm" onClick={save}>{saved ? <><Check className="size-4" />Update alert</> : <><Bell className="size-4" />Create alert</>}</Button>{saved ? <Button size="sm" variant="ghost" onClick={clear}>Remove</Button> : null}</div></div>{message ? <p role="status" className="mt-2 text-xs text-primary">{message}</p> : null}<p className="mt-2 text-[11px] text-subtle">Browser alerts are enabled when supported. Email delivery requires a configured email provider and scheduler.</p></Card>;
}
