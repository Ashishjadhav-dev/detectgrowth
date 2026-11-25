"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { RecoveryCode } from "@/components/auth/recovery-code";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authRequest, usesExternalAuth } from "@/lib/auth";

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
    if (mode === "reset-password" && usesExternalAuth && resetStep === "email") {
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
    if (mode === "reset-password" && usesExternalAuth && resetStep === "code") {
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
    if (mode === "reset-password" && usesExternalAuth && resetStep === "password" && password !== confirmPassword) {
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
        await authRequest("reset-password", usesExternalAuth ? { resetToken, password } : { email, recoveryCode, password });
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
          <p className="mt-2 text-sm text-muted">{mode === "reset-password" ? !usesExternalAuth ? "Use the recovery code you saved when creating your account." : resetStep === "email" ? "Enter your email and we’ll send you a verification code." : resetStep === "code" ? `Enter the code sent to ${email}.` : "Choose a new password for your account." : isSignIn ? "Sign in to your DetectGrowth workspace." : "Start your DetectGrowth workspace."}</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={submit}>
          {mode === "sign-up" ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Name <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" aria-label="Name" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label> : null}
          {mode === "reset-password" && (!usesExternalAuth || resetStep === "code") ? <label className="block text-sm"><span className="mb-2 block font-medium text-ink">{usesExternalAuth ? "Verification code" : "Recovery code"} <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] tracking-[0.2em] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" aria-label={usesExternalAuth ? "Verification code" : "Recovery code"} required value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} autoComplete="one-time-code" placeholder="Enter your code" /></label> : null}
          {mode !== "reset-password" || !usesExternalAuth || resetStep !== "code" ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Email <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" aria-label="Email" required autoComplete="email" type="email" value={email} readOnly={mode === "reset-password" && resetStep === "password"} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label> : null}
          {(mode !== "reset-password" || !usesExternalAuth || resetStep === "password") && <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-ink">
              <label htmlFor="auth-password">{mode === "reset-password" && usesExternalAuth ? "New password" : "Password"} <span className="text-danger" aria-hidden="true">*</span></label>
              {isSignIn && <button type="button" disabled={loading} className="text-xs font-medium text-primary hover:text-primary-hover hover:underline disabled:opacity-50" onClick={() => { setMode("reset-password"); setPassword(""); setConfirmPassword(""); setShowPassword(false); setResetStep("email"); setRecoveryCode(""); setResetToken(""); setError(""); setRecovered(false); }}>Forgot password?</button>}
            </div>
            <div className="relative">
              <Input id="auth-password" className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] pr-10 focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" aria-label={mode === "reset-password" && usesExternalAuth ? "New password" : "Password"} required minLength={8} autoComplete={isSignIn ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "reset-password" ? "Create a new password" : "Your password"} />
              <button type="button" disabled={loading} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-2 top-1/2 grid h-9 w-8 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 disabled:opacity-50">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </div>
            {!isSignIn && <p className="mt-2 text-xs text-muted">Use at least 8 characters.</p>}
          </div>}
          {mode === "reset-password" && usesExternalAuth && resetStep === "password" ? <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Confirm new password <span className="text-danger" aria-hidden="true">*</span></span><Input className="h-11 rounded-lg border-neutral-200/80 bg-[#faf9f6] focus:border-primary focus:ring-2 focus:ring-primary/10 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#faf9f6]" aria-label="Confirm new password" required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your new password" /></label> : null}
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button className="h-11 w-full bg-primary text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" disabled={loading}>{loading ? <LoadingDots /> : mode === "reset-password" ? !usesExternalAuth ? "Reset password" : resetStep === "email" ? "Send verification code" : resetStep === "code" ? "Continue" : "Update password" : isSignIn ? "Sign in" : "Create account"}</Button>
        </form>
        {recovered ? <><p role="status" className="mt-4 text-sm text-success">Password reset. Sign in with your new password.</p><RecoveryCode /></> : null}
        {isSignIn ? <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400"><span className="h-px flex-1 bg-neutral-200/60" />OR<span className="h-px flex-1 bg-neutral-200/60" /></div> : null}
        {isSignIn && <Button type="button" variant="secondary" disabled={loading} onClick={useDemoAccount} className="w-full"><Zap className="size-4 text-amber-500" />Continue with demo account</Button>}
        <button type="button" disabled={loading} onClick={() => { setMode(isSignIn ? "sign-up" : "sign-in"); setError(""); }} className="mt-5 w-full text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50">{isSignIn ? "Create a new account" : "Already have an account? Sign in"}</button>
      </Card>
    </main>
  );
}
