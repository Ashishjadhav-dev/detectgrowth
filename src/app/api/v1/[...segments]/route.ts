import { NextRequest, NextResponse } from "next/server";
import { tokenHash, transact } from "@/lib/server/accounts";
import { demoCompanies, demoDashboard, demoIntegrations, demoLists, demoOpportunities, demoPeople, demoResearch, demoSignals } from "@/data/demo";

export const runtime = "nodejs";
type Row = Record<string, unknown>;
const guestUser = { id: "guest-demo", name: "Demo User", email: "demo@detectgrowth.com", workspace: "Demo Workspace", isDemo: true };
async function handle(request: NextRequest, context: { params: Promise<{ segments: string[] }> }) {
  const token = request.cookies.get("detectgrowth_session")?.value;
  const isGuest = request.cookies.get("detectgrowth_guest")?.value === "1";
  if (!token && !isGuest) return NextResponse.json({ error: { message: "Please sign in." } }, { status: 401 });
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: { message: "Invalid origin." } }, { status: 403 });
  const { segments } = await context.params;
  const method = request.method;
  const input = method === "POST" || method === "PATCH" ? await request.json() : {};
  return transact((db) => {
    const user = isGuest ? guestUser : db.sessions[tokenHash(token!)]?.user;
    if (!user) return NextResponse.json({ error: { message: "Your session has expired." } }, { status: 401 });
    db.workspaces ??= {};
    const workspace = db.workspaces[user.id] ??= structuredClone({ companies: demoCompanies, people: demoPeople, signals: demoSignals, opportunities: demoOpportunities, lists: demoLists, integrations: demoIntegrations, applications: [], jobAlerts: [], dashboard: demoDashboard, icp: { industries: "SaaS, E-commerce", locations: "India", employeeSize: "51-200", revenue: "", signals: {} } });
    workspace.applications ??= [];
    workspace.jobAlerts ??= [];
    const ok = (data: unknown) => NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
    workspace.bookmarks ??= [];
    const fail = (message: string, status = 400) => NextResponse.json({ error: { message } }, { status });
    if (segments[0] === "job-hunt") {
      const jobHunt = workspace.jobHunt as { resumeText?: string; matches?: Row[]; applications?: Row[]; lastScanAt?: string } ?? {};
      jobHunt.matches ??= [];
      jobHunt.applications ??= [];
      workspace.jobHunt = jobHunt;
      if (segments.length === 1 && method === "GET") return ok({ matches: jobHunt.matches, applications: jobHunt.applications, lastScanAt: jobHunt.lastScanAt ?? null });
      if (segments[1] === "scan" && method === "POST") {
        const resumeText = typeof input.resumeText === "string" ? input.resumeText.slice(0, 50000) : "";
        const jobs = Array.isArray(input.jobs) ? input.jobs.slice(0, 100) as Row[] : [];
        if (resumeText.trim().length < 20) return fail("Add resume details before scanning for matches.");
        const stopWords = new Set("and the with from for your this that into have will are our you job role using their they about looking years work team more than not all can has its are but how what who where when able across through including other based remote hybrid onsite experience skills".split(/\s+/));
        const words = (value: string) => [...new Set(value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word)))];
        const resumeWords = new Set(words(resumeText));
        jobHunt.matches = jobs.map((job) => {
          const content = `${String(job.title ?? "")} ${String(job.description ?? "")} ${String(job.tags ?? "")} ${String(job.department ?? "")}`;
          const jobWords = words(content);
          const matchedKeywords = jobWords.filter((word) => resumeWords.has(word)).slice(0, 12);
          const missingKeywords = jobWords.filter((word) => !resumeWords.has(word)).slice(0, 8);
          const titleWords = words(String(job.title ?? ""));
          const titleMatches = titleWords.filter((word) => resumeWords.has(word)).length;
          const score = Math.min(99, Math.max(35, Math.round(35 + (matchedKeywords.length / Math.max(jobWords.length, 1)) * 150 + titleMatches * 8)));
          const previous = jobHunt.matches?.find((match) => match.jobId === job.id);
          return { id: previous?.id ?? crypto.randomUUID(), jobId: String(job.id), title: String(job.title ?? "Untitled role"), company: String(job.company ?? "Unknown company"), url: String(job.url ?? ""), location: String(job.location ?? "Location not listed"), workplace: String(job.workplace ?? "Unknown"), score, matchedKeywords, missingKeywords, postedAt: job.postedAt ?? null, status: jobHunt.applications?.some((application) => application.matchId === (previous?.id ?? "")) ? "applied" : "matched" };
        }).filter((match) => match.score >= 55).sort((left, right) => right.score - left.score).slice(0, 30);
        jobHunt.resumeText = resumeText;
        jobHunt.lastScanAt = new Date().toISOString();
        return ok({ matches: jobHunt.matches, applications: jobHunt.applications, lastScanAt: jobHunt.lastScanAt });
      }
      if (segments[1] === "applications" && method === "POST") {
        const match = jobHunt.matches.find((item) => item.id === input.matchId);
        if (!match) return fail("This job match is no longer available.", 404);
        const existing = jobHunt.applications.find((item) => item.matchId === match.id);
        if (existing) return ok(existing);
        const application = { id: crypto.randomUUID(), matchId: match.id, jobId: match.jobId, title: match.title, company: match.company, url: match.url, appliedAt: new Date().toISOString(), status: "applied" };
        jobHunt.applications.unshift(application);
        match.status = "applied";
        return ok(application);
      }
      return fail("Job hunt route not found.", 404);
    }
    if (segments[0] === "settings" && segments[1] === "preferences") {
      if (method === "PATCH") workspace.preferences = { ...(workspace.preferences as object ?? {}), ...input };
      return ok(workspace.preferences ?? { alerts: true, digest: false, reminders: true, role: "Sales", onboarded: false });
    }
    if (segments[0] === "settings" && segments[1] === "icp") {
      if (method === "PATCH") workspace.icp = input;
      return ok(workspace.icp);
    }
    if (segments[0] === "research") {
      const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
      const company = (workspace.companies as Row[]).find((row) => String(row.name).toLowerCase().includes(query));
      if (!query || !company) return fail("No matching company found. Try another company name.", 404);
      const evidence = (workspace.signals as Row[]).filter((row) => row.company === company.name).map((row) => ({ ...row, title: row.type, detectedAt: new Date().toISOString(), sourceUrl: row.sourceUrl ?? "" }));
      return ok({ company, evidence, generatedAt: new Date().toISOString() });
    }
    if (segments[0] === "dashboard") {
      const dashboard = workspace.dashboard as Record<string, unknown>;
      const opportunities = workspace.opportunities as Row[];
      const signals = workspace.signals as Row[];
      const companies = workspace.companies as Row[];
      const people = workspace.people as Row[];
      dashboard.opportunities = opportunities.map((row) => ({ ...row, signal: "Account activity" }));
      dashboard.signals = signals;
      dashboard.summary = { newOpportunities: String(opportunities.length), companiesSurging: String(companies.length), newSignals: String(signals.length), peopleDiscovered: String(people.length), pipelineValue: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(opportunities.reduce((total, row) => total + Number(row.expectedValue ?? 0), 0)), averageGrowthScore: String(opportunities.length ? Math.round(opportunities.reduce((total, row) => total + Number(row.score ?? 0), 0) / opportunities.length) : 0), growthDelta: "—" };
      dashboard.pipeline = ["New", "Discovery", "Qualified", "Proposal", "Won", "Lost"].map((stage) => ({ title: stage, count: String(opportunities.filter((row) => row.stage === stage).length), value: `$${opportunities.filter((row) => row.stage === stage).reduce((sum, row) => sum + Number(row.expectedValue ?? 0), 0).toLocaleString()}` }));
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
    if (method === "PATCH" || method === "POST") {
      for (const field of ["score", "confidence"]) if (input[field] !== undefined && (!Number.isFinite(input[field]) || input[field] < 0 || input[field] > 100)) return fail(`${field} must be between 0 and 100.`);
      if (input.expectedValue !== undefined && (!Number.isFinite(input.expectedValue) || input.expectedValue < 0)) return fail("Expected value must be a positive number or zero.");
    }
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
      if (segments[0] === "opportunities") Object.assign(row, { company: company?.name ?? input.company ?? "New account", industry: company?.industry ?? input.industry ?? "Other", location: company?.location ?? "", employees: company?.employeeRange ?? "—", score: Number(input.score ?? 50), stage: input.stage ?? "New", signals: [] });
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
