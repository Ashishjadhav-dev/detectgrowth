"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_EMAIL, DEMO_PASSWORD, authRequest } from "@/lib/auth";

export default function Page() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const useDemoAccount = async () => {
    setLoading(true);
    setError("");
    try { await authRequest("demo"); window.location.assign("/dashboard"); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to open demo."); setLoading(false); }
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authRequest(mode, { name, email, password });
      window.location.assign(mode === "sign-up" ? "/onboarding" : "/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === "sign-in";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(91,53,230,.12),transparent_38%),#f7f8fc] px-4 py-8">
      <Card className="w-full max-w-[440px] overflow-hidden border-white/80 p-6 shadow-[0_24px_80px_rgba(55,52,44,.10)] sm:p-8">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_10px_24px_rgba(91,53,230,.22)]">DG</div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">{isSignIn ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-muted">{isSignIn ? "Sign in to your DetectGrowth workspace." : "Start your DetectGrowth workspace."}</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          {!isSignIn ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Name</span><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label> : null}
          <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Email</span><Input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Password</span><div className="relative"><Input required minLength={8} autoComplete={isSignIn ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" className="pr-11" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button className="w-full" disabled={loading}>{loading ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}</Button>
        </form>

        {isSignIn ? <button type="button" disabled={loading} onClick={useDemoAccount} className="mt-4 w-full rounded-xl border border-primary/20 bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary transition hover:border-primary/40 disabled:opacity-50">Continue with demo account</button> : null}
        <button type="button" onClick={() => { setMode(isSignIn ? "sign-up" : "sign-in"); setError(""); }} className="mt-5 w-full text-sm font-medium text-primary hover:underline">{isSignIn ? "Create a new account" : "Already have an account? Sign in"}</button>
        {isSignIn ? <p className="mt-6 text-center text-xs text-muted">Demo: {DEMO_EMAIL} · {DEMO_PASSWORD}</p> : null}
      </Card>
    </main>
  );
}
