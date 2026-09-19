export const DEMO_EMAIL = "demo@detectgrowth.com";
export const DEMO_PASSWORD = "detectgrowth123";
export type SessionUser = { id: string; name: string; email: string; workspace: string; isDemo: boolean };
export async function authRequest(action: string, input?: Record<string, string>) {
  const response = await fetch(`/api/auth/${action}`, {
    method: action === "session" ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: action === "session" ? undefined : JSON.stringify(input ?? {}),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to complete this action.");
  if (data.recoveryCode) window.sessionStorage.setItem("detectgrowth-recovery-code", data.recoveryCode);
  if (action === "profile") window.dispatchEvent(new Event("auth-changed"));
  return data.user as SessionUser | null;
}
export async function clearDemoSession() {
  await authRequest("sign-out");
  window.localStorage.removeItem("detectgrowth-demo-session");
  window.sessionStorage.removeItem("detectgrowth-recovery-code");
}
