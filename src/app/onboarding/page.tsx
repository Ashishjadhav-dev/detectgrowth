"use client";
import { useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function Page() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("Sales");
  const [goal, setGoal] = useState("Find qualified accounts");
  const [signals, setSignals] = useState(["Hiring", "Product launches"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const finish = async (skip = false) => {
    setBusy(true); setError("");
    try { await apiRequest("/api/v1/settings/preferences", { method: "PATCH", body: JSON.stringify({ role, goal, signalTypes: signals, onboarded: !skip }) }); window.location.assign("/dashboard"); }
    catch { setError("Unable to save setup. Please try again."); setBusy(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-canvas p-4"><Card className="w-full max-w-xl p-6 sm:p-8"><p className="text-xs font-medium text-primary">Step {step + 1} of 3</p><h1 className="mt-3 text-2xl font-semibold">{["Your role", "Your primary goal", "Signals to follow"][step]}</h1><p className="mt-2 text-sm text-muted">Personalize your workspace. You can change your preferences later.</p>
    <div className="mt-6 space-y-3">{step === 0 ? <label className="block text-sm">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3">{["Sales", "Marketing", "Founder", "Operations", "Research"].map((value) => <option key={value}>{value}</option>)}</select></label> : step === 1 ? <label className="block text-sm">Goal<select value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3">{["Find qualified accounts", "Track company growth", "Build a contact list", "Research opportunities"].map((value) => <option key={value}>{value}</option>)}</select></label> : ["Hiring", "Product launches", "Funding", "Expansion", "Website changes"].map((value) => <label key={value} className="flex min-h-11 items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={signals.includes(value)} onChange={(event) => setSignals((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} />{value}</label>)}</div>
    {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
    <div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="ghost" disabled={busy} onClick={() => finish(true)}>Skip for now</Button><div className="flex gap-2">{step > 0 ? <Button variant="secondary" disabled={busy} onClick={() => setStep((value) => value - 1)}>Back</Button> : null}<Button disabled={busy} onClick={() => step === 2 ? finish() : setStep((value) => value + 1)}>{busy ? "Saving…" : step === 2 ? "Open dashboard" : "Continue"}</Button></div></div>
  </Card></main>;
}
