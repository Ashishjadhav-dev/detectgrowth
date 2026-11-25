import { NextRequest, NextResponse } from "next/server";
import { tokenHash, transact } from "@/lib/server/accounts";

export const leadError = (error: string, status: number) => NextResponse.json({ error }, {
  status,
  headers: { "Cache-Control": "private, no-store" },
});

export const leadJson = <T>(data: T) => NextResponse.json(data, {
  headers: { "Cache-Control": "private, no-store" },
});

export async function leadAccess(request: NextRequest) {
  const token = request.cookies.get("detectgrowth_session")?.value;
  if (token) {
    const user = await transact((db) => db.sessions[tokenHash(token)]?.user);
    return user ? { id: user.isDemo ? "guest" : user.id, guest: user.isDemo } : null;
  }
  if (request.cookies.get("detectgrowth_guest")?.value === "1") return { id: "guest", guest: true };
  return null;
}

// The public services share a per-process request budget; demo traffic shares a single actor.
type Bucket = { count: number; reset: number };
const shared = globalThis as typeof globalThis & { leadBudgets?: Map<string, Bucket> };
const buckets = shared.leadBudgets ??= new Map();

export function takeLeadBudget(action: "search" | "audit", id: string) {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.reset <= now) buckets.delete(key);
  const limits = [[action, action === "search" ? 50 : 30], [`${action}:${id}`, id === "guest" ? 12 : 18]] as const;
  if (limits.some(([key, max]) => (buckets.get(key)?.count ?? 0) >= max)) return false;
  for (const [key] of limits) {
    const previous = buckets.get(key);
    buckets.set(key, { count: (previous?.count ?? 0) + 1, reset: previous?.reset ?? now + 60_000 });
  }
  return true;
}
