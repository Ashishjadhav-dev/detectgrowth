"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_EMAIL, DEMO_PASSWORD, authRequest } from "@/lib/auth";

function LoadingDots() {
  return <span className="inline-flex items-center gap-1" aria-label="Loading"><span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-current" /></span>;
}

export default function Page() {
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "reset-password">("sign-in");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recovered, setRecovered] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
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
    if (mode === "reset-password" && resetStep === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
      setLoading(true);
      try { await authRequest("request-password-reset", { email: email.trim() }); setResetStep("code"); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to send the verification code."); }
      finally { setLoading(false); }
      return;
    }
    if (mode === "reset-password" && resetStep === "code") {
      if (recoveryCode.trim().length < 4) {
        setError("Enter the verification code sent to your email.");
        return;
      }
      setLoading(true);
      try {
        const result = await authRequest("verify-password-reset", { email: email.trim(), code: recoveryCode.trim() });
        const token = (result as { resetToken?: string } | null)?.resetToken;
        if (!token) throw new Error("Unable to verify the code.");
        setResetToken(token);
        setResetStep("password");
      } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to verify the code."); }
      finally { setLoading(false); }
      return;
    }
    if (mode === "reset-password" && resetStep === "password" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "sign-up") {
      if (name.trim().length < 2) {
        setError("Please enter your name (at least 2 characters).");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Please enter a valid work email address.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "reset-password") {
        await authRequest("reset-password", { resetToken, password });
        setRecovered(true); setMode("sign-in"); setResetStep("email"); setRecoveryCode(""); setResetToken(""); setPassword(""); setConfirmPassword("");
        return;
      }
      await authRequest(mode, { name, email, password, recoveryCode });
      window.location.assign(mode === "sign-up" ? "/onboarding" : "/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === "sign-in";

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <Card className="w-full max-w-sm overflow-hidden border-neutral-200/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,.08)] sm:p-8">
        <div className="text-center">
          <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className="brand-logo mx-auto h-auto w-[180px] object-contain" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{mode === "reset-password" ? "Reset your password" : isSignIn ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-muted">{mode === "reset-password" ? resetStep === "email" ? "Enter your email and we’ll send you a verification code." : resetStep === "code" ? `Enter the code sent to ${email}.` : "Choose a new password for your account." : isSignIn ? "Sign in to your DetectGrowth workspace." : "Start your DetectGrowth workspace."}</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          {mode === "sign-up" ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Name <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label> : null}
          {mode === "reset-password" && resetStep === "code" ? <label className="block text-sm"><span className="mb-2 block font-medium text-ink">Verification code <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] tracking-[0.2em] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" required value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} autoComplete="one-time-code" placeholder="Enter your code" /></label> : null}
          {mode !== "reset-password" || resetStep !== "code" ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">{mode === "reset-password" ? "Email address" : "Work email"} <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" required autoComplete="email" type="email" value={email} readOnly={mode === "reset-password" && resetStep === "password"} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label> : null}
          {(mode !== "reset-password" || resetStep === "password") ? <label className="block"><span className="mb-2 flex items-center justify-between text-sm font-medium text-ink"><span>{mode === "reset-password" ? "New password" : "Password"} <span className="text-danger" aria-hidden="true">*</span></span>{isSignIn ? <button type="button" disabled={loading} className="text-xs font-medium text-primary hover:text-primary-hover hover:underline disabled:pointer-events-none disabled:opacity-50" onClick={() => { setMode("reset-password"); setResetStep("email"); setRecoveryCode(""); setResetToken(""); setError(""); setRecovered(false); }}>Forgot password?</button> : null}</span><div className="relative"><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] pr-10 focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" required minLength={8} autoComplete={isSignIn ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "reset-password" ? "Create a new password" : "Your password"} /><button type="button" disabled={loading} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-2 top-1/2 grid h-9 w-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 disabled:pointer-events-none disabled:opacity-50">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{mode === "sign-up" || mode === "reset-password" ? <p className="mt-2 text-xs text-muted">Use at least 8 characters.</p> : null}</label> : null}
          {mode === "reset-password" && resetStep === "password" ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Confirm new password <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your new password" /></label> : null}
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button className="h-11 w-full bg-primary text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" disabled={loading}>{loading ? <LoadingDots /> : mode === "reset-password" ? resetStep === "email" ? "Send verification code" : resetStep === "code" ? "Continue" : "Update password" : isSignIn ? "Sign in" : "Create account"}</Button>
        </form>
        {recovered ? <><p role="status" className="mt-4 text-sm text-success">Password reset. Sign in with your new password.</p><RecoveryCode /></> : null}
        {isSignIn ? <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400"><span className="h-px flex-1 bg-neutral-200/60" />OR<span className="h-px flex-1 bg-neutral-200/60" /></div> : null}
        {isSignIn ? <div className="space-y-3"><button type="button" disabled={loading} onClick={() => setError("Google sign-in is not configured for this workspace yet.")} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"><svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.09.31-1.58V7.89H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.11l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.39c1.43 0 2.7.49 3.71 1.45l2.78-2.78C16.84 3.39 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.11 9.46 6.39 12 6.39Z"/></svg>Continue with Google</button><button type="button" disabled={loading} onClick={useDemoAccount} title={`Quick demo access · ${DEMO_EMAIL} · ${DEMO_PASSWORD}`} className="mx-auto flex items-center justify-center gap-2 text-sm font-medium text-primary transition hover:text-primary-hover hover:underline disabled:pointer-events-none disabled:opacity-50"><Zap className="size-4 text-amber-500" />Explore demo</button></div> : null}
        <button type="button" disabled={loading} onClick={() => { setMode(isSignIn ? "sign-up" : "sign-in"); setError(""); }} className="mt-5 w-full text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50">{isSignIn ? "New to DetectGrowth? Create your account" : "Already have an account? Sign in"}</button>
      </Card>
    </main>
  );
}
