import { test } from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
async function request(action, body, cookie = "") {
  const response = await fetch(`${base}/api/auth/${action}`, {
    method: action === "session" ? "GET" : "POST",
    headers: { Origin: base, "Content-Type": "application/json", Cookie: cookie },
    body: action === "session" ? undefined : JSON.stringify(body ?? {}),
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

test("demo session persists, uses HTTP-only cookies, and is invalidated at logout", async () => {
  const login = await request("demo");
  assert.equal(login.status, 200);
  assert.equal(login.body.user.name, "Demo User");
  assert.ok(login.cookie);
  const session = await request("session", null, login.cookie);
  assert.equal(session.body.user.id, login.body.user.id);
  await request("sign-out", {}, login.cookie);
  assert.equal((await request("session", null, login.cookie)).body.user, null);
});

test("sign-up, duplicate rejection, wrong password, and returning sign-in", async () => {
  const input = { email: `test-${crypto.randomUUID()}@example.com`, name: "Test Account", password: "Test-password-123" };
  const created = await request("sign-up", input);
  assert.equal(created.status, 200);
  assert.equal(created.body.user.name, input.name);
  assert.equal(created.body.user.isDemo, false);
  assert.equal((await request("sign-up", input)).status, 400);
  assert.equal((await request("sign-in", { ...input, password: "wrong-password" })).status, 400);
  assert.equal((await request("sign-in", input)).body.user.id, created.body.user.id);
});

test("rejects untrusted origins and malformed credentials", async () => {
  const response = await fetch(`${base}/api/auth/demo`, { method: "POST", headers: { Origin: "https://untrusted.example" } });
  assert.equal(response.status, 403);
  assert.equal((await request("sign-up", { email: "bad", password: "x" })).status, 400);
  assert.equal((await request("session", null, "detectgrowth_session=forged")).body.user, null);
});
