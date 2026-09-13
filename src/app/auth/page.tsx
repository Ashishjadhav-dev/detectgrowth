"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";

export default function Page() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await apiRequest(mode === "sign-in" ? "/api/v1/auth/sign-in" : "/api/v1/auth/sign-up", { method: "POST", body: JSON.stringify(mode === "sign-in" ? { email, password } : { name, email, password }) }); router.push("/dashboard"); router.refresh(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to authenticate."); }
    finally { setLoading(false); }
  }
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(91,53,230,.1),transparent_30%),radial-gradient(circle_at_top_right,rgba(47,111,237,.08),transparent_25%),#f7f8fc] px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <Card className="glass-card flex flex-col justify-between overflow-hidden p-8"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Authentication & account</div><h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Grow with better signals</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Connect your workspace to live company, people, signal, and opportunity data.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-2">{["Google", "Microsoft", "Okta", "OneLogin"].map((provider) => <button key={provider} type="button" disabled className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">{provider} SSO · coming soon</button>)}</div><div className="mt-8 grid gap-3 md:grid-cols-2"><div className="rounded-3xl border border-border bg-white p-4"><div className="text-sm font-medium text-ink">Secure sessions</div><p className="mt-2 text-sm leading-6 text-muted">Sessions are stored as hashed tokens and expire automatically.</p></div><div className="rounded-3xl border border-border bg-white p-4"><div className="text-sm font-medium text-ink">Workspace aware</div><p className="mt-2 text-sm leading-6 text-muted">Every account gets its own workspace for isolated data.</p></div></div></Card>
      <Card className="glass-card p-8"><div className="mx-auto max-w-md"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{mode === "sign-in" ? "Sign in" : "Create account"}</div><h2 className="mt-3 text-2xl font-semibold text-ink">{mode === "sign-in" ? "Welcome back" : "Start your workspace"}</h2><p className="mt-2 text-sm text-muted">{mode === "sign-in" ? "Enter your workspace email and password to continue." : "Create an account to start using live DetectGrowth data."}</p><form className="mt-6 space-y-4" onSubmit={submit}>{mode === "sign-up" && <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Name</span><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}<label className="block"><span className="mb-2 block text-sm font-medium text-ink">Email</span><Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-ink">Password</span><Input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? "Connecting…" : mode === "sign-in" ? "Sign in" : "Create account"}</Button></form><button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); }} className="mt-5 w-full text-sm text-primary">{mode === "sign-in" ? "Create a new account" : "Already have an account? Sign in"}</button><div className="mt-6 rounded-3xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">The local development API is connected to PostgreSQL. Social sign-in can be enabled later with provider credentials.</div></div></Card>
    </div>
  </div>;
}
