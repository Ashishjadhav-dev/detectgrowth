export const DEMO_EMAIL = "demo@detectgrowth.com";
export const DEMO_PASSWORD = "detectgrowth123";
export type SessionUser = { id: string; name: string; email: string; workspace: string; isDemo: boolean };
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const backendActions = new Set(["sign-in", "sign-up", "sign-out", "demo", "request-password-reset", "verify-password-reset", "reset-password"]);

function mapUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as { id?: string; name?: string; email?: string; workspace?: string | { name?: string }; isDemo?: boolean };
  return { id: value.id ?? "", name: value.name ?? "", email: value.email ?? "", workspace: typeof value.workspace === "string" ? value.workspace : value.workspace?.name ?? "DetectGrowth Workspace", isDemo: Boolean(value.isDemo) };
}

async function parseResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? data.error ?? "Unable to complete this action.");
  return data;
}

export async function authRequest(action: string, input?: Record<string, string>) {
  const useBackend = Boolean(API_BASE_URL) && (backendActions.has(action) || action === "session");
  const path = useBackend ? action === "session" ? "/api/v1/me" : `/api/v1/auth/${action}` : `/api/auth/${action}`;
  const response = await fetch(`${useBackend ? API_BASE_URL : ""}${path}`, {
    method: action === "session" ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: action === "session" ? undefined : JSON.stringify(input ?? {}),
    cache: "no-store",
  });
  if (action === "session" && response.status === 401) return null;
  const data = await parseResponse(response);
  if (data.recoveryCode) window.sessionStorage.setItem("detectgrowth-recovery-code", data.recoveryCode);
  if (action === "profile") window.dispatchEvent(new Event("auth-changed"));
  const payload = data.data ?? data.user ?? data;
  if (action === "verify-password-reset") return payload as { resetToken?: string };
  return mapUser(payload);
}
export async function clearDemoSession() {
  await authRequest("sign-out");
  window.localStorage.removeItem("detectgrowth-demo-session");
  window.sessionStorage.removeItem("detectgrowth-recovery-code");
}
