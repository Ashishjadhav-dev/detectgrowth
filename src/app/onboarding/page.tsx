"use client";
import { useState } from "react";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function Page() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("Job seeker");
  const [goal, setGoal] = useState("Find my next opportunity");
  const [signals, setSignals] = useState(["Job recommendations", "Resume & CV creation"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const finish = async (skip = false) => {
    setBusy(true); setError("");
    try { await apiRequest("/api/v1/settings/preferences", { method: "PATCH", body: JSON.stringify({ role, goal, signalTypes: signals, onboarded: !skip }) }); window.location.assign("/dashboard"); }
    catch { setError("Unable to save setup. Please try again."); setBusy(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-canvas p-4"><Card className="w-full max-w-xl p-6 sm:p-8"><p className="text-xs font-medium text-primary">Step {step + 1} of 3</p><h1 className="mt-3 text-2xl font-semibold">{["Tell us about your journey", "What would you like to achieve?", "Choose the tools you want to use"][step]}</h1><p className="mt-2 text-sm text-muted">Personalize your workspace. You can change your preferences later.</p>
    <div className="mt-6 space-y-3">{step === 0 ? <label className="block text-sm">I’m using DetectGrowth as<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3">{["Job seeker", "Career switcher", "Student or recent graduate", "Recruiter", "Career coach"].map((value) => <option key={value}>{value}</option>)}</select></label> : step === 1 ? <label className="block text-sm">My main focus is<select value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3">{["Find my next opportunity", "Create a polished resume", "Improve my ATS score", "Track my job applications", "Prepare for interviews"].map((value) => <option key={value}>{value}</option>)}</select></label> : ["Job recommendations", "Resume & CV creation", "ATS score & analysis", "Application tracking", "Interview preparation"].map((value) => <label key={value} className="flex min-h-11 items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={signals.includes(value)} onChange={(event) => setSignals((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} />{value}</label>)}</div>
    <RecoveryCode />
    {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
    <div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="ghost" disabled={busy} onClick={() => finish(true)}>Skip for now</Button><div className="flex gap-2">{step > 0 ? <Button variant="secondary" disabled={busy} onClick={() => setStep((value) => value - 1)}>Back</Button> : null}<Button disabled={busy} onClick={() => step === 2 ? finish() : setStep((value) => value + 1)}>{busy ? "Saving…" : step === 2 ? "Open dashboard" : "Continue"}</Button></div></div>
  </Card></main>;
}
