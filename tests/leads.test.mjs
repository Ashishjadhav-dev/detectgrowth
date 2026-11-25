import { test } from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function request(path, { method = "GET", cookie = "", body, origin = base } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

async function account() {
  const result = await request("/api/auth/sign-up", {
    method: "POST",
    body: { email: `leads-${crypto.randomUUID()}@example.com`, name: "Lead test", password: "Lead-Password-12345" },
  });
  assert.equal(result.status, 200);
  return result.cookie;
}

test("lead discovery validates input and distinguishes example results", async () => {
  const path = "/api/leads?locality=Cambridge&category=Dental+clinics&radius=3000&mode=demo";
  assert.equal((await request(path)).status, 401);
  const guest = await request("/api/auth/demo", { method: "POST" });
  assert.equal((await request(path.replace("Dental+clinics", "unsupported"), { cookie: guest.cookie })).status, 400);
  const result = await request(path, { cookie: guest.cookie });
  assert.equal(result.status, 200);
  assert.equal(result.data.source, "Demo");
  assert.ok(result.data.leads.length > 0 && result.data.leads.every((lead) => lead.source === "Demo"));
  assert.equal((await request("/api/leads/audit?url=invalid", { cookie: guest.cookie })).status, 400);
  assert.equal((await request("/api/leads/saved", { cookie: guest.cookie })).status, 401);
});

test("saved leads are workspace scoped and can create one pipeline opportunity", async () => {
  const cookie = await account();
  const second = await account();
  const lead = { id: "osm-node-123", name: "Fixture Dental", source: "OpenStreetMap", category: "Dental clinics", locality: "Cambridge", website: "https://example.com/" };
  const root = "/api/leads/saved";
  const record = `${root}?id=${lead.id}`;
  const audit = { checkedAt: "2026-11-25T09:00:00.000Z", status: 503, title: "", mobileReady: null, secure: true, lastModified: null, changeSignals: ["Homepage returned HTTP 503"] };
  const create = { method: "POST", cookie, body: { ...lead, websiteAudit: audit } };
  assert.equal((await request(root, { ...create, origin: "https://untrusted.example" })).status, 403);
  assert.equal((await request(root, { ...create, body: { ...lead, source: "Google Places" } })).status, 400);
  assert.equal((await request(root, create)).data.status, "New");
  assert.deepEqual((await request(root, { cookie })).data[0].websiteAudit, audit);
  const stale = { ...audit, checkedAt: "2026-11-24T09:00:00.000Z", status: 200 };
  assert.equal((await request(record, { method: "PATCH", cookie, body: { websiteAudit: stale } })).data.websiteAudit.status, 503);
  assert.equal((await request(record, { method: "PATCH", cookie, body: { websiteAudit: { ...audit, status: 900 } } })).status, 400);
  await request(root, create);
  assert.equal((await request(root, { cookie })).data.length, 1);
  assert.deepEqual((await request(root, { cookie: second })).data, []);
  assert.equal((await request("/api/v1/savedLeads", { cookie })).status, 404);
  assert.equal((await request(record, { method: "PATCH", cookie, body: { status: "invalid" } })).status, 400);
  const updated = await request(record, { method: "PATCH", cookie, body: { status: "Interested", notes: "Verified source." } });
  assert.equal(updated.data.notes, "Verified source.");
  assert.equal((await request(root, { cookie })).data[0].status, "Interested");
  const options = { method: "POST", cookie, body: { action: "promote" } };
  const opportunity = await request(record, options);
  assert.equal(opportunity.status, 200);
  assert.equal((await request(record, options)).data.id, opportunity.data.id);
  const pipeline = await request(`/api/v1/opportunities/${opportunity.data.id}`, { cookie });
  assert.equal(pipeline.data.data.stage, "Qualified");
  assert.equal(pipeline.data.data.company, lead.name);
  assert.equal(pipeline.data.data.score, 72);
  assert.equal(pipeline.data.data.signals[0].title, "Homepage returned HTTP 503");
  assert.equal(pipeline.data.data.signals[0].sourceUrl, lead.website);
  assert.equal((await request(record, { method: "DELETE", cookie })).status, 200);
  assert.deepEqual((await request(root, { cookie })).data, []);
});

test("market watchlists persist, deduplicate, and recheck inside the owning workspace", async () => {
  const root = "/api/leads/watchlists";
  const cookie = await account();
  const second = await account();
  const market = { locality: "Cambridge", category: "Dental clinics", radius: 3000, demo: true };

  assert.equal((await request(root)).status, 401);
  assert.equal((await request(root, { method: "POST", cookie, body: market, origin: "https://untrusted.example" })).status, 403);
  assert.equal((await request(root, { method: "POST", cookie, body: { ...market, radius: 999 } })).status, 400);
  const first = await request(root, { method: "POST", cookie, body: market });
  assert.equal(first.status, 200);
  assert.equal(first.data.report.status, "baseline");
  assert.equal(first.data.report.total, 6);
  assert.equal(first.data.baseline, undefined);
  const duplicate = await request(root, { method: "POST", cookie, body: { ...market, locality: "  cambridge  " } });
  assert.equal(duplicate.data.id, first.data.id);
  assert.equal((await request(root, { cookie })).data.length, 1);
  assert.deepEqual((await request(root, { cookie: second })).data, []);

  const item = `${root}?id=${first.data.id}`;
  const recheck = { method: "POST", body: { action: "recheck" } };
  assert.equal((await request(item, { ...recheck, cookie: second })).status, 404);
  const updated = await request(item, { ...recheck, cookie });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.report.status, "compared");
  assert.equal(updated.data.report.comparedWith, first.data.report.checkedAt);
  assert.deepEqual(updated.data.report.newLeads, []);
  assert.deepEqual(updated.data.report.changedLeads, []);
  assert.equal((await request(item, { method: "DELETE", cookie: second })).status, 404);
  assert.equal((await request(item, { method: "DELETE", cookie })).status, 200);
  assert.deepEqual((await request(root, { cookie })).data, []);
});
