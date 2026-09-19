import { NextRequest, NextResponse } from "next/server";
import { tokenHash, transact } from "@/lib/server/accounts";
import { demoCompanies, demoDashboard, demoIntegrations, demoLists, demoOpportunities, demoPeople, demoResearch, demoSignals } from "@/data/demo";

export const runtime = "nodejs";
type Row = Record<string, unknown>;
async function handle(request: NextRequest, context: { params: Promise<{ segments: string[] }> }) {
  const token = request.cookies.get("detectgrowth_session")?.value;
  if (!token) return NextResponse.json({ error: { message: "Please sign in." } }, { status: 401 });
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: { message: "Invalid origin." } }, { status: 403 });
  const { segments } = await context.params;
  const method = request.method;
  const input = method === "POST" || method === "PATCH" ? await request.json() : {};
  return transact((db) => {
    const user = db.sessions[tokenHash(token)]?.user;
    if (!user) return NextResponse.json({ error: { message: "Your session has expired." } }, { status: 401 });
    db.workspaces ??= {};
    const workspace = db.workspaces[user.id] ??= structuredClone({ companies: demoCompanies, people: demoPeople, signals: demoSignals, opportunities: demoOpportunities, lists: demoLists, integrations: demoIntegrations, dashboard: demoDashboard, icp: { industries: "SaaS, E-commerce", locations: "India", employeeSize: "51-200", revenue: "", signals: {} } });
    const ok = (data: unknown) => NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
    const fail = (message: string, status = 400) => NextResponse.json({ error: { message } }, { status });
    if (segments[0] === "settings" && segments[1] === "preferences") {
      if (method === "PATCH") workspace.preferences = { ...(workspace.preferences as object ?? {}), ...input };
      return ok(workspace.preferences ?? { alerts: true, digest: false, reminders: true, role: "Sales", onboarded: false });
    }
    if (segments[0] === "settings" && segments[1] === "icp") {
      if (method === "PATCH") workspace.icp = input;
      return ok(workspace.icp);
    }
    if (segments[0] === "research") return ok(demoResearch(request.nextUrl.searchParams.get("q") ?? ""));
    if (segments[0] === "dashboard") {
      const dashboard = workspace.dashboard as Record<string, unknown>;
      if (method === "PATCH" && segments[1] === "tasks") {
        const task = (dashboard.tasks as Row[]).find((item) => item.id === segments[2]);
        if (!task) return fail("Task not found.", 404);
        task.completed = Boolean(input.completed);
        return ok(task);
      }
      return dashboard[segments[1]] === undefined ? fail("Not found.", 404) : ok(dashboard[segments[1]]);
    }
    const collection = workspace[segments[0]];
    if (!Array.isArray(collection)) return fail("Not found.", 404);
    const rows = collection as Row[];
    const key = segments[0] === "integrations" ? "provider" : "id";
    const index = rows.findIndex((row) => row[key] === segments[1]);
    if (method === "GET") {
      if (segments[1]) return index < 0 ? fail("Record not found.", 404) : ok(rows[index]);
      const query = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
      return ok(rows.filter((row) => !query || Object.values(row).some((value) => typeof value === "string" && value.toLowerCase().includes(query))));
    }
    if (method === "POST") {
      if (Object.keys(input).length === 0) return fail("Enter the required details.");
      const company = (workspace.companies as Row[]).find((item) => item.id === input.companyId);
      const row: Row = { ...input, id: crypto.randomUUID(), updated: "Today", createdAt: new Date().toISOString() };
      if (segments[0] === "lists") { if (!String(input.name ?? "").trim()) return fail("List name is required."); row.count = 0; }
      if (segments[0] === "opportunities") Object.assign(row, { company: company?.name ?? input.company ?? "New account", industry: company?.industry ?? "Other", location: company?.location ?? "", employees: company?.employeeRange ?? "—", score: Number(input.score ?? 50), stage: input.stage ?? "New", signals: [] });
      if (segments[0] === "signals") Object.assign(row, { type: input.title ?? input.type, company: company?.name ?? input.company ?? "Workspace", time: "Just now", confidence: input.confidence ?? 80, impact: input.impact ?? "Medium", description: input.description ?? "" });
      rows.unshift(row);
      return ok(row);
    }
    if (index < 0) return fail("Record not found.", 404);
    if (method === "DELETE") { rows.splice(index, 1); return ok({ id: segments[1], deleted: true }); }
    if (method === "PATCH") { const id = rows[index][key]; Object.assign(rows[index], input, { [key]: id }); return ok(rows[index]); }
    return fail("Method not allowed.", 405);
  });
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
