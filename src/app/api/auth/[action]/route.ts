import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { credentials, newSession, publicUser, tokenHash, transact, verify } from "@/lib/server/accounts";

export const runtime = "nodejs";
const cookieName = "detectgrowth_session";
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  const user = token ? await transact((db) => db.sessions[tokenHash(token)]?.user ?? null) : null;
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return fail("Request origin is not allowed.", 403);
  const { action } = await context.params;
  if (!["sign-in", "sign-up", "demo", "sign-out"].includes(action)) return fail("Not found.", 404);
  try {
    if (action === "sign-out") {
      const token = request.cookies.get(cookieName)?.value;
      if (token) await transact((db) => { delete db.sessions[tokenHash(token)]; });
      const response = NextResponse.json({ user: null });
      response.cookies.delete(cookieName);
      return response;
    }
    const input = action === "demo" ? {} : await request.json();
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    const demo = action === "demo" || (email === "demo@detectgrowth.com" && ["detectgrowth123", "Demo@123"].includes(password));
    if (!demo && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128)) return fail("Enter a valid email and a password between 8 and 128 characters.");
    const result = await transact((db) => {
      let user;
      if (demo) user = { id: randomUUID(), name: "Demo User", email: "demo@detectgrowth.com", workspace: "Demo Workspace", isDemo: true };
      else if (action === "sign-up") {
        const name = typeof input.name === "string" ? input.name.trim() : "";
        if (name.length < 2 || name.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
        if (email === "demo@detectgrowth.com" || db.accounts.some((account) => account.email === email)) throw new Error("Unable to create this account. Try signing in instead.");
        const account = { id: randomUUID(), name, email, workspace: `${name}'s Workspace`, isDemo: false, ...credentials(password) };
        db.accounts.push(account);
        user = publicUser(account);
      } else {
        const account = db.accounts.find((item) => item.email === email);
        if (!account || !verify(password, account)) throw new Error("Email or password is incorrect.");
        user = publicUser(account);
      }
      const oldToken = request.cookies.get(cookieName)?.value;
      if (oldToken) delete db.sessions[tokenHash(oldToken)];
      return { user, token: newSession(db, user) };
    });
    const response = NextResponse.json({ user: result.user });
    response.cookies.set(cookieName, result.token, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 7 * 86400 });
    return response;
  } catch (error) {
    if (error instanceof Error && !('code' in error)) return fail(error.message);
    return fail("Unable to access account storage. Please try again.", 503);
  }
}
