import { test } from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const headers = { Origin: base, "Content-Type": "application/json" };
async function demo() {
  const response = await fetch(`${base}/api/auth/demo`, { method: "POST", headers });
  return response.headers.get("set-cookie").split(";")[0];
}
async function api(path, cookie, method = "GET", body) {
  const response = await fetch(`${base}/api/v1/${path}`, { method, headers: { ...headers, Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, ...(await response.json()) };
}
test("workspace endpoints require a valid session", async () => {
  assert.equal((await api("lists", "")).status, 401);
  assert.equal((await api("lists", "detectgrowth_session=forged")).status, 401);
});
test("list CRUD persists across requests and isolates workspaces", async () => {
  const cookie = await demo();
  const created = await api("lists", cookie, "POST", { name: "My test list", type: "manual" });
  assert.equal(created.status, 200);
  const id = created.data.id;
  assert.equal((await api(`lists/${id}`, cookie)).data.name, "My test list");
  assert.equal((await api(`lists/${id}`, await demo())).status, 404);
  await api(`lists/${id}`, cookie, "PATCH", { name: "Renamed" });
  assert.equal((await api(`lists/${id}`, cookie)).data.name, "Renamed");
  await api(`lists/${id}`, cookie, "DELETE");
  assert.equal((await api(`lists/${id}`, cookie)).status, 404);
});
test("task state, opportunity identity, zero score, and search remain accurate", async () => {
  const cookie = await demo();
  const tasks = await api("dashboard/tasks", cookie);
  const id = tasks.data[0].id;
  await api(`dashboard/tasks/${id}`, cookie, "PATCH", { completed: true });
  assert.equal((await api("dashboard/tasks", cookie)).data[0].completed, true);
  const opportunity = await api("opportunities", cookie, "POST", { company: "Searchable Account", score: 0 });
  assert.equal(opportunity.data.company, "Searchable Account");
  assert.equal(opportunity.data.score, 0);
  assert.equal((await api("opportunities?q=Searchable", cookie)).data.length, 1);
  assert.deepEqual((await api("opportunities?q=nonexistent-query", cookie)).data, []);
});
