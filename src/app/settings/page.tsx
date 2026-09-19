"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-provider";
import { authRequest, clearDemoSession } from "@/lib/auth";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const user = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [workspace, setWorkspace] = useState(user?.workspace ?? "");
  const [preferences, setPreferences] = useState({ alerts: true, digest: false, reminders: true });
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();
  useEffect(() => { apiRequest<typeof preferences>("/api/v1/settings/preferences").then(setPreferences).catch(() => setError("Unable to load preferences. Please refresh to retry.")); }, []);
  const save = async (section: string, action: () => Promise<unknown>) => {
    setBusy(section); setError("");
    try { await action(); showToast("Changes saved"); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to save. Please retry."); }
    finally { setBusy(""); }
  };
  return <div className="min-w-0 space-y-5">
    <div><h1 className="page-title">Settings</h1><p className="mt-2 text-sm text-muted">Manage your profile, workspace, and account.</p></div>
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <Card className="min-w-0 p-5"><h2 className="section-title">Profile and workspace</h2><form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); void save("profile", () => authRequest("profile", { name, workspace })); }}>
        <label className="block text-sm">Full name<Input className="mt-2" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="block text-sm">Email<Input className="mt-2" readOnly value={user?.email ?? ""} /></label>
        <label className="block text-sm">Workspace name<Input className="mt-2" required maxLength={100} value={workspace} onChange={(event) => setWorkspace(event.target.value)} /></label>
        <Button disabled={Boolean(busy)}>{busy === "profile" ? "Saving…" : "Save profile"}</Button>
      </form></Card>
      <Card className="p-5"><h2 className="section-title">Notifications</h2><form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); void save("preferences", () => apiRequest("/api/v1/settings/preferences", { method: "PATCH", body: JSON.stringify(preferences) })); }}>
        {([["alerts", "Signal alerts"], ["digest", "Daily digest"], ["reminders", "Task reminders"]] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-border p-3 text-sm">{label}<input type="checkbox" checked={Boolean(preferences[key])} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}
        <Button disabled={Boolean(busy)}>{busy === "preferences" ? "Saving…" : "Save preferences"}</Button>
      </form></Card>
      <Card className="p-5"><h2 className="section-title">Security</h2>{user?.isDemo ? <p className="mt-3 text-sm text-muted">The demo account uses shared sign-in credentials.</p> : <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); void save("password", async () => { await authRequest("password", { currentPassword, password }); setCurrentPassword(""); setPassword(""); }); }}>
        <label className="block text-sm">Current password<Input className="mt-2" required autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label className="block text-sm">New password<Input className="mt-2" required minLength={8} maxLength={128} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <Button disabled={Boolean(busy)}>{busy === "password" ? "Saving…" : "Change password"}</Button>
      </form>}
      <Button variant="secondary" className="mt-5" disabled={Boolean(busy)} onClick={() => save("logout", async () => { await clearDemoSession(); window.location.assign("/auth"); })}>Sign out</Button></Card>
    </div>
  </div>;
}
