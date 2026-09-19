import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomBytes } from "node:crypto";
import { credentials, newSession, publicUser, tokenHash, transact, verify } from "@/lib/server/accounts";

export const runtime = "nodejs";
const cookieName = "detectgrowth_session";
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const attempts = new Map<string, { count: number; until: number }>();

export async function GET(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  const user = token ? await transact((db) => db.sessions[tokenHash(token)]?.user ?? null) : null;
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return fail("Request origin is not allowed.", 403);
  const { action } = await context.params;
  if (!["sign-in", "sign-up", "demo", "sign-out", "profile", "password", "reset-password"].includes(action)) return fail("Not found.", 404);
  if (Number(request.headers.get("content-length") ?? 0) > 16384) return fail("Request is too large.", 413);
  try {
    if (action === "sign-out") {
      const token = request.cookies.get(cookieName)?.value;
      if (token) await transact((db) => { delete db.sessions[tokenHash(token)]; });
      const response = NextResponse.json({ user: null });
      response.cookies.delete(cookieName);
      return response;
    }
    const input = action === "demo" ? {} : await request.json();
    if (action === "profile" || action === "password") {
      const token = request.cookies.get(cookieName)?.value;
      return await transact((db) => {
        const session = token ? db.sessions[tokenHash(token)] : undefined;
        if (!session) return fail("Please sign in again.", 401);
        const account = db.accounts.find((item) => item.id === session.user.id);
        if (action === "password") {
          if (!account) return fail("Password changes are available for registered accounts.");
          if (typeof input.currentPassword !== "string" || !verify(input.currentPassword, account)) return fail("Current password is incorrect.");
          if (typeof input.password !== "string" || input.password.length < 8 || input.password.length > 128) return fail("Use a password between 8 and 128 characters.");
          Object.assign(account, credentials(input.password));
          for (const [key, value] of Object.entries(db.sessions)) if (value.user.id === account.id && key !== tokenHash(token!)) delete db.sessions[key];
        } else {
          if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.length > 80 || typeof input.workspace !== "string" || !input.workspace.trim() || input.workspace.length > 100) return fail("Enter a name and workspace name.");
          const profile = { name: input.name.trim(), workspace: input.workspace.trim() };
          if (account) Object.assign(account, profile);
          for (const value of Object.values(db.sessions)) if (value.user.id === session.user.id) Object.assign(value.user, profile);
        }
        return NextResponse.json({ user: session.user });
      });
    }
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (["sign-in", "sign-up", "reset-password"].includes(action)) {
      for (const [key, attempt] of attempts) if (attempt.until < Date.now()) attempts.delete(key);
      const key = `${action}:${email}`;
      const attempt = attempts.get(key) ?? { count: 0, until: Date.now() + 15 * 60000 };
      if (attempt.count >= 20) return fail("Too many attempts. Please try again in 15 minutes.", 429);
      attempt.count++; attempts.set(key, attempt);
    }
    if (action === "reset-password") {
      if (password.length < 8 || password.length > 128) return fail("Use a password between 8 and 128 characters.");
      return await transact((db) => {
        const account = db.accounts.find((item) => item.email === email);
        if (!account?.recoveryHash || typeof input.recoveryCode !== "string" || tokenHash(input.recoveryCode.trim()) !== account.recoveryHash) return fail("The email or recovery code is incorrect.");
        const recoveryCode = randomBytes(16).toString("hex");
        Object.assign(account, credentials(password), { recoveryHash: tokenHash(recoveryCode) });
        for (const [key, session] of Object.entries(db.sessions)) if (session.user.id === account.id) delete db.sessions[key];
        return NextResponse.json({ user: null, recoveryCode });
      });
    }
    const demo = action === "demo" || (action === "sign-in" && email === "demo@detectgrowth.com" && ["detectgrowth123", "Demo@123"].includes(password));
    if (!demo && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128)) return fail("Enter a valid email and a password between 8 and 128 characters.");
    const result = await transact((db) => {
      let user;
      let recoveryCode: string | undefined;
      if (demo) user = { id: randomUUID(), name: "Demo User", email: "demo@detectgrowth.com", workspace: "Demo Workspace", isDemo: true };
      else if (action === "sign-up") {
        const name = typeof input.name === "string" ? input.name.trim() : "";
        if (name.length < 2 || name.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
        if (email === "demo@detectgrowth.com" || db.accounts.some((account) => account.email === email)) throw new Error("Unable to create this account. Try signing in instead.");
        recoveryCode = randomBytes(16).toString("hex");
        const account = { id: randomUUID(), name, email, workspace: `${name}'s Workspace`, isDemo: false, recoveryHash: tokenHash(recoveryCode), ...credentials(password) };
        db.accounts.push(account);
        user = publicUser(account);
      } else {
        const account = db.accounts.find((item) => item.email === email);
        if (!account || !verify(password, account)) throw new Error("Email or password is incorrect.");
        user = publicUser(account);
      }
      const oldToken = request.cookies.get(cookieName)?.value;
      if (oldToken) delete db.sessions[tokenHash(oldToken)];
      return { user, token: newSession(db, user), recoveryCode };
    });
    const response = NextResponse.json({ user: result.user, recoveryCode: result.recoveryCode });
    response.cookies.set(cookieName, result.token, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 7 * 86400 });
    return response;
  } catch (error) {
    if (error instanceof Error && !('code' in error)) return fail(error.message);
    return fail("Unable to access account storage. Please try again.", 503);
  }
}
